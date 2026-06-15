import { PrismaClient, Prisma } from '@prisma/client'
import { Transaction } from '../../domain/entities/Transaction'
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { TransactionMapper } from './TransactionMapper'
import { prisma as defaultPrisma } from '../prisma/client'

/**
 * Implementação concreta de `ITransactionRepository` usando Prisma.
 * Aceita uma instância de `PrismaClient` (ou de uma `$transaction`) via
 * construtor, para suportar o `PrismaUnitOfWork`.
 */
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient = defaultPrisma) {}

  async save(transaction: Transaction): Promise<void> {
    const data = TransactionMapper.toPersistence(transaction)
    await this.client.transaction.create({ data })
  }

  async findById(id: string): Promise<Transaction | null> {
    const raw = await this.client.transaction.findUnique({ where: { id } })
    return raw ? TransactionMapper.toDomain(raw) : null
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const rows = await this.client.transaction.findMany({
      where: {
        OR: [{ originAccountId: accountId }, { destinationAccountId: accountId }],
      },
      orderBy: { createdAt: 'desc' },
    })

    return rows.map(TransactionMapper.toDomain)
  }
}
