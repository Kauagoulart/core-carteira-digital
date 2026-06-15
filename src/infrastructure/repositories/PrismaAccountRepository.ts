import { PrismaClient, Prisma } from '@prisma/client'
import { Account } from '../../domain/entities/Account'
import { Document } from '../../domain/value-objects/Document'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { AccountMapper } from './AccountMapper'
import { prisma as defaultPrisma } from '../prisma/client'

/**
 * Implementação concreta de `IAccountRepository` usando Prisma.
 *
 * Esta é a ÚNICA camada que sabe que existe um banco de dados relacional
 * por trás das contas. O Caso de Uso (`TransferFundsUseCase`,
 * `DepositUseCase`, etc.) recebe esta classe apenas através da interface
 * `IAccountRepository` - ele não importa, e não pode importar, nada deste
 * arquivo (DIP).
 *
 * Aceita uma instância de `PrismaClient` (ou de uma transação `$transaction`)
 * via construtor, permitindo que o `PrismaUnitOfWork` reutilize esta mesma
 * implementação dentro de uma transação atômica.
 */
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient = defaultPrisma) {}

  async findById(id: string): Promise<Account | null> {
    const raw = await this.client.account.findUnique({ where: { id } })
    return raw ? AccountMapper.toDomain(raw) : null
  }

  async findByDocument(document: Document): Promise<Account | null> {
    const raw = await this.client.account.findUnique({
      where: { documentId: document.value },
    })
    return raw ? AccountMapper.toDomain(raw) : null
  }

  async save(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account)
    await this.client.account.create({ data })
  }

  async update(account: Account): Promise<void> {
    const data = AccountMapper.toPersistence(account)
    await this.client.account.update({
      where: { id: account.id },
      data: { balanceCents: data.balanceCents },
    })
  }
}
