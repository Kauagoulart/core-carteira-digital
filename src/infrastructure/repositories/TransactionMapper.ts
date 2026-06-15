import { Transaction as PrismaTransaction } from '@prisma/client'
import { Transaction, TransactionStatus, TransactionType } from '../../domain/entities/Transaction'
import { Money } from '../../domain/value-objects/Money'

export class TransactionMapper {
  static toDomain(raw: PrismaTransaction): Transaction {
    return Transaction.restore({
      id: raw.id,
      type: raw.type as TransactionType,
      amount: Money.fromCents(raw.amountCents),
      originAccountId: raw.originAccountId,
      destinationAccountId: raw.destinationAccountId,
      status: raw.status as TransactionStatus,
      description: raw.description ?? undefined,
      createdAt: raw.createdAt,
    })
  }

  static toPersistence(transaction: Transaction) {
    return {
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amount.getCents(),
      status: transaction.status,
      description: transaction.description ?? null,
      originAccountId: transaction.originAccountId,
      destinationAccountId: transaction.destinationAccountId,
      createdAt: transaction.createdAt,
    }
  }
}
