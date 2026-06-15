import { PrismaClient, Prisma } from '@prisma/client'
import { IUnitOfWork, TransferPersistencePayload } from '../../domain/repositories/IUnitOfWork'
import { AccountMapper } from './AccountMapper'
import { TransactionMapper } from './TransactionMapper'
import { prisma as defaultPrisma } from '../prisma/client'

/**
 * Implementação concreta de `IUnitOfWork` usando `prisma.$transaction`.
 *
 * `runTransfer` executa as 3 escritas de uma transferência (atualizar
 * conta origem, atualizar conta destino, criar o registro de transação)
 * dentro de UMA ÚNICA transação SQL. Se qualquer uma dessas operações
 * falhar (ex: erro de conexão, violação de constraint), o Prisma faz
 * ROLLBACK automático de TODAS elas - garantindo que o dinheiro nunca
 * fique "pela metade" (debitado de um lado e não creditado do outro).
 */
export class PrismaUnitOfWork implements IUnitOfWork {
  constructor(private readonly client: PrismaClient = defaultPrisma) {}

  async runTransfer(payload: TransferPersistencePayload): Promise<void> {
    const { origin, destination, transaction } = payload

    await this.client.$transaction(async (tx: Prisma.TransactionClient) => {
      const originData = AccountMapper.toPersistence(origin)
      const destinationData = AccountMapper.toPersistence(destination)
      const transactionData = TransactionMapper.toPersistence(transaction)

      await tx.account.update({
        where: { id: origin.id },
        data: { balanceCents: originData.balanceCents },
      })

      await tx.account.update({
        where: { id: destination.id },
        data: { balanceCents: destinationData.balanceCents },
      })

      await tx.transaction.create({ data: transactionData })
    })
  }
}
