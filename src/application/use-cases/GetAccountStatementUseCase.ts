import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { AccountNotFoundError } from '../../domain/errors'

export interface GetAccountStatementInput {
  accountId: string
}

export interface AccountStatementTransaction {
  id: string
  type: string
  amount: number
  originAccountId: string | null
  destinationAccountId: string | null
  status: string
  description?: string
  createdAt: Date
}

export interface GetAccountStatementOutput {
  accountId: string
  ownerName: string
  document: string
  balance: number
  transactions: AccountStatementTransaction[]
}

/**
 * Caso de Uso: Consulta de saldo + extrato de uma conta.
 *
 * Caso de uso puramente de LEITURA - não altera nenhum estado. Mantido
 * separado de `TransferFundsUseCase`/`DepositUseCase`/etc. para respeitar
 * o SRP: ler dados é uma responsabilidade diferente de movimentar dinheiro.
 */
export class GetAccountStatementUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async execute(input: GetAccountStatementInput): Promise<GetAccountStatementOutput> {
    const account = await this.accountRepository.findById(input.accountId)
    if (!account) {
      throw new AccountNotFoundError(input.accountId)
    }

    const transactions = await this.transactionRepository.findByAccountId(account.id)

    return {
      accountId: account.id,
      ownerName: account.ownerName,
      document: account.document.format(),
      balance: account.balance.toReais(),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount.toReais(),
        originAccountId: transaction.originAccountId,
        destinationAccountId: transaction.destinationAccountId,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
      })),
    }
  }
}
