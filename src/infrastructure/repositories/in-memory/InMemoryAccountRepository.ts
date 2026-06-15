import { Account } from '../../../domain/entities/Account'
import { Document } from '../../../domain/value-objects/Document'
import { IAccountRepository } from '../../../domain/repositories/IAccountRepository'

/**
 * Implementação em memória de `IAccountRepository`.
 *
 * Usada em testes unitários e exemplos rápidos, sem depender de um banco
 * de dados real. Por causa do DIP, o `TransferFundsUseCase` funciona de
 * forma IDÊNTICA com esta implementação ou com `PrismaAccountRepository` -
 * ele simplesmente não sabe (nem precisa saber) qual delas está em uso.
 */
export class InMemoryAccountRepository implements IAccountRepository {
  private accounts = new Map<string, Account>()

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null
  }

  async findByDocument(document: Document): Promise<Account | null> {
    for (const account of this.accounts.values()) {
      if (account.document.equals(document)) {
        return account
      }
    }
    return null
  }

  async save(account: Account): Promise<void> {
    this.accounts.set(account.id, account)
  }

  async update(account: Account): Promise<void> {
    this.accounts.set(account.id, account)
  }
}
