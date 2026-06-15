import { Account } from '../../domain/entities/Account'
import { Document } from '../../domain/value-objects/Document'
import { IAccountRepository } from '../../domain/repositories/IAccountRepository'
import { DocumentAlreadyInUseError } from '../../domain/errors'

export interface CreateAccountInput {
  documentValue: string
  ownerName: string
}

export interface CreateAccountOutput {
  accountId: string
  document: string
  ownerName: string
  balance: number
}

/**
 * Caso de Uso: Abertura de Conta.
 *
 * Toda conta nasce com saldo ZERO e vinculada a um CPF/CNPJ válido
 * (validado pelo Value Object `Document`). Não é permitido abrir duas
 * contas para o mesmo documento.
 */
export class CreateAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    const document = Document.create(input.documentValue)

    const existingAccount = await this.accountRepository.findByDocument(document)
    if (existingAccount) {
      throw new DocumentAlreadyInUseError(document.format())
    }

    const account = Account.open({
      document,
      ownerName: input.ownerName,
    })

    await this.accountRepository.save(account)

    return {
      accountId: account.id,
      document: account.document.format(),
      ownerName: account.ownerName,
      balance: account.balance.toReais(),
    }
  }
}
