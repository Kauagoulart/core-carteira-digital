import { Money } from '../../domain/value-objects/Money'
import { Transaction, TransactionType } from '../../domain/entities/Transaction'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { AccountNotFoundError } from '../../domain/errors'

export interface DepositInput {
  accountId: string
  amountInCents: number
}

export interface DepositOutput {
  accountId: string
  newBalance: number
  transactionId: string
}

/**
 * Caso de Uso: Depósito.
 *
 * SRP: este caso de uso tem UMA responsabilidade - creditar um valor em
 * uma conta e registrar a transação correspondente. A validação de "o
 * valor deve ser positivo" é delegada ao Value Object `Money` e à
 * entidade `Account`.
 */
export class DepositUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async execute(input: DepositInput): Promise<DepositOutput> {
    const account = await this.accountRepository.findById(input.accountId)
    if (!account) {
      throw new AccountNotFoundError(input.accountId)
    }

    const amount = Money.fromCents(input.amountInCents)

    // Regra de negócio (validação de valor positivo) vive na entidade.
    account.credit(amount)

    await this.accountRepository.update(account)

    const transaction = Transaction.create({
      type: TransactionType.DEPOSIT,
      amount,
      originAccountId: null,
      destinationAccountId: account.id,
      description: 'Depósito em conta',
    })

    await this.transactionRepository.save(transaction)

    return {
      accountId: account.id,
      newBalance: account.balance.toReais(),
      transactionId: transaction.id,
    }
  }
}
