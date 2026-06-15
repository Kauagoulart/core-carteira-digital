import { Transaction } from '../../../domain/entities/Transaction'
import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository'

export class InMemoryTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = []

  async save(transaction: Transaction): Promise<void> {
    this.transactions.push(transaction)
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find((t) => t.id === id) ?? null
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactions
      .filter((t) => t.originAccountId === accountId || t.destinationAccountId === accountId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
