import { Money } from '../../domain/value-objects/Money'
import { Transaction, TransactionType, TransactionStatus } from '../../domain/entities/Transaction'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { IUnitOfWork } from '../../domain/repositories/IUnitOfWork'
import { AccountNotFoundError, SameAccountTransferError } from '../../domain/errors'

export interface TransferFundsInput {
  originAccountId: string
  destinationAccountId: string
  /** Valor da transferência em CENTAVOS (inteiro), evitando problemas de float na borda HTTP. */
  amountInCents: number
  description?: string
}

export interface TransferFundsOutput {
  transactionId: string
  originAccountId: string
  originBalance: number
  destinationAccountId: string
  destinationBalance: number
}

/**
 * Caso de Uso: Transferência de fundos entre contas (ex: PIX interno).
 *
 * Este é "o grande desafio" do projeto. Responsabilidades deste caso de uso
 * (SRP - e SOMENTE estas):
 *   1. Buscar as duas contas via `IAccountRepository`.
 *   2. Executar débito/crédito chamando os MÉTODOS DA ENTIDADE `Account`
 *      (a validação de saldo mora lá, não aqui - "Regra de Ouro").
 *   3. Criar o registro de `Transaction` (extrato).
 *   4. Pedir para a infraestrutura persistir as duas contas + a transação
 *      de forma ATÔMICA, via `IUnitOfWork`.
 *
 * O QUE ESTE CASO DE USO **NÃO** FAZ (e propositalmente não deve fazer):
 *   - Não sabe se o banco é Postgres, MySQL ou SQLite (DIP) - ele só
 *     conhece `IAccountRepository` e `IUnitOfWork`.
 *   - Não envia e-mail/SMS de notificação. Notificações são uma
 *     responsabilidade totalmente separada (SRP) - poderiam ser feitas por
 *     um listener de evento de domínio ou um serviço próprio, chamado pela
 *     rota/controller DEPOIS que este caso de uso retorna com sucesso.
 *   - Não decide o status HTTP da resposta (isso é responsabilidade do
 *     controller/rota).
 */
export class TransferFundsUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(input: TransferFundsInput): Promise<TransferFundsOutput> {
    if (input.originAccountId === input.destinationAccountId) {
      throw new SameAccountTransferError()
    }

    const [originAccount, destinationAccount] = await Promise.all([
      this.accountRepository.findById(input.originAccountId),
      this.accountRepository.findById(input.destinationAccountId),
    ])

    if (!originAccount) {
      throw new AccountNotFoundError(input.originAccountId)
    }

    if (!destinationAccount) {
      throw new AccountNotFoundError(input.destinationAccountId)
    }

    const amount = Money.fromCents(input.amountInCents)

    // --- Regras de negócio aplicadas DENTRO da entidade ---
    // Se `originAccount.balance < amount`, `debit()` lança
    // `InsufficientFundsError` e a execução é interrompida ANTES de
    // qualquer crédito ocorrer e ANTES de qualquer escrita no banco - o
    // dinheiro nunca chega a ser "duplicado" nem "perdido" em memória.
    originAccount.debit(amount)
    destinationAccount.credit(amount)

    const transaction = Transaction.create({
      type: TransactionType.TRANSFER,
      amount,
      originAccountId: originAccount.id,
      destinationAccountId: destinationAccount.id,
      status: TransactionStatus.COMPLETED,
      description: input.description ?? 'Transferência entre contas',
    })

    // Persiste as duas contas + a transação em uma ÚNICA transação de banco
    // de dados (tudo ou nada). Se qualquer escrita falhar, TUDO é desfeito
    // (rollback), inclusive as alterações de saldo em memória que já
    // calculamos acima. Veja `PrismaUnitOfWork` / `InMemoryUnitOfWork`.
    await this.unitOfWork.runTransfer({
      origin: originAccount,
      destination: destinationAccount,
      transaction,
    })

    return {
      transactionId: transaction.id,
      originAccountId: originAccount.id,
      originBalance: originAccount.balance.toReais(),
      destinationAccountId: destinationAccount.id,
      destinationBalance: destinationAccount.balance.toReais(),
    }
  }
}
