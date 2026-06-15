import { IUnitOfWork, TransferPersistencePayload } from '../../../domain/repositories/IUnitOfWork'
import { InMemoryAccountRepository } from './InMemoryAccountRepository'
import { InMemoryTransactionRepository } from './InMemoryTransactionRepository'

/**
 * Implementação em memória de `IUnitOfWork`.
 *
 * Como as operações em memória são síncronas/instantâneas, não há um
 * "rollback" real de banco aqui - mas a interface garante que, mesmo
 * trocando para `PrismaUnitOfWork` em produção, o `TransferFundsUseCase`
 * continua chamando exatamente o mesmo método (`runTransfer`).
 */
export class InMemoryUnitOfWork implements IUnitOfWork {
  constructor(
    private readonly accountRepository: InMemoryAccountRepository,
    private readonly transactionRepository: InMemoryTransactionRepository
  ) {}

  async runTransfer(payload: TransferPersistencePayload): Promise<void> {
    const { origin, destination, transaction } = payload

    await this.accountRepository.update(origin)
    await this.accountRepository.update(destination)
    await this.transactionRepository.save(transaction)
  }
}
