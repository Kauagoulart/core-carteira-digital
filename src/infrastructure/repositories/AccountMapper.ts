import { Account as PrismaAccount } from '@prisma/client'
import { Account } from '../../domain/entities/Account'
import { Document } from '../../domain/value-objects/Document'
import { Money } from '../../domain/value-objects/Money'

/**
 * Converte entre o modelo de persistência do Prisma e a entidade de
 * domínio `Account`.
 *
 * Manter essa conversão isolada aqui evita que a entidade `Account`
 * precise saber qualquer coisa sobre o formato de armazenamento (ex:
 * que o documento é dividido em `documentId` + `documentType`, ou que o
 * saldo é guardado como `balanceCents`).
 */
export class AccountMapper {
  static toDomain(raw: PrismaAccount): Account {
    return Account.restore({
      id: raw.id,
      document: Document.create(raw.documentId),
      ownerName: raw.ownerName,
      balance: Money.fromCents(raw.balanceCents),
      createdAt: raw.createdAt,
    })
  }

  static toPersistence(account: Account) {
    return {
      id: account.id,
      documentId: account.document.value,
      documentType: account.document.documentType,
      ownerName: account.ownerName,
      balanceCents: account.balance.getCents(),
      createdAt: account.createdAt,
    }
  }
}
