import { Money } from '../../domain/value-objects/Money'
import { Transaction, TransactionType } from '../../domain/entities/Transaction'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { AccountNotFoundError } from '../../domain/errors'

export interface CashbackInput {
  accountId: string
  amountInCents: number
  description?: string
}

export interface CashbackOutput {
  accountId: string
  newBalance: number
  transactionId: string
}

/**
 * Caso de Uso: Cashback.
 *
 * ESTE ARQUIVO É A PROVA DO OCP (Open/Closed Principle) DESTE PROJETO.
 *
 * Para adicionar este NOVO tipo de transação ao sistema, o que foi preciso
 * alterar em código já existente?
 *   - `Account`            -> NADA. `credit()` já existia e já é genérico.
 *   - `TransferFundsUseCase` -> NADA.
 *   - `IAccountRepository` / `ITransactionRepository` -> NADA, as
 *     assinaturas já existentes (`findById`, `update`, `save`) são
 *     suficientes.
 *   - O único ponto "estendido" foi o enum `TransactionType`, que recebeu
 *     o valor `CASHBACK` (uma extensão aditiva, não uma modificação de
 *     comportamento existente).
 *
 * Ou seja: o sistema está "fechado para modificação, mas aberto para
 * extensão" - novas regras de negócio (cashback, bônus de indicação,
 * estorno, etc.) podem ser adicionadas criando NOVOS casos de uso que
 * reaproveitam as entidades e interfaces existentes, sem o risco de
 * quebrar a lógica de transferência (ou qualquer outra) já em produção.
 */
export class CashbackUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async execute(input: CashbackInput): Promise<CashbackOutput> {
    const account = await this.accountRepository.findById(input.accountId)
    if (!account) {
      throw new AccountNotFoundError(input.accountId)
    }

    const amount = Money.fromCents(input.amountInCents)

    account.credit(amount)
    await this.accountRepository.update(account)

    const transaction = Transaction.create({
      type: TransactionType.CASHBACK,
      amount,
      originAccountId: null,
      destinationAccountId: account.id,
      description: input.description ?? 'Cashback',
    })

    await this.transactionRepository.save(transaction)

    return {
      accountId: account.id,
      newBalance: account.balance.toReais(),
      transactionId: transaction.id,
    }
  }
}
