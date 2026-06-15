import { Money } from '../../domain/value-objects/Money'
import { Transaction, TransactionType } from '../../domain/entities/Transaction'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { AccountNotFoundError } from '../../domain/errors'

export interface WithdrawInput {
  accountId: string
  amountInCents: number
}

export interface WithdrawOutput {
  accountId: string
  newBalance: number
  transactionId: string
}

/**
 * Caso de Uso: Saque.
 *
 * Regra de Ouro: a validação "não é possível sacar mais do que o saldo
 * disponível" NÃO está aqui. Está dentro de `Account.debit()`. Se o saldo
 * for insuficiente, `account.debit(amount)` lança `InsufficientFundsError`,
 * que se propaga até a camada HTTP e é traduzida para um status 422/400.
 */
export class WithdrawUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async execute(input: WithdrawInput): Promise<WithdrawOutput> {
    const account = await this.accountRepository.findById(input.accountId)
    if (!account) {
      throw new AccountNotFoundError(input.accountId)
    }

    const amount = Money.fromCents(input.amountInCents)

    // Se o saldo for insuficiente, a própria entidade lança o erro.
    account.debit(amount)

    await this.accountRepository.update(account)

    const transaction = Transaction.create({
      type: TransactionType.WITHDRAWAL,
      amount,
      originAccountId: account.id,
      destinationAccountId: null,
      description: 'Saque em conta',
    })

    await this.transactionRepository.save(transaction)

    return {
      accountId: account.id,
      newBalance: account.balance.toReais(),
      transactionId: transaction.id,
    }
  }
}
