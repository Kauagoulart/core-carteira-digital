/**
 * Erros de domínio.
 *
 * Centralizar os erros aqui permite que a camada de apresentação (rotas HTTP)
 * saiba mapear cada tipo de erro para um status code apropriado, sem que a
 * camada de domínio precise conhecer absolutamente nada sobre HTTP.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

/** Lançado quando um valor monetário inválido é fornecido (negativo, zero onde não permitido, não numérico, etc.) */
export class InvalidAmountError extends DomainError {
  constructor(message = 'Valor monetário inválido.') {
    super(message)
  }
}

/** Lançado quando um CPF/CNPJ não passa pela validação dos dígitos verificadores. */
export class InvalidDocumentError extends DomainError {
  constructor(value: string) {
    super(`Documento inválido: "${value}".`)
  }
}

/** A regra de ouro: nenhuma conta pode sair do saldo negativo. */
export class InsufficientFundsError extends DomainError {
  constructor(accountId: string) {
    super(`Saldo insuficiente na conta "${accountId}" para realizar esta operação.`)
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super(`Conta "${accountId}" não encontrada.`)
  }
}

export class DocumentAlreadyInUseError extends DomainError {
  constructor(document: string) {
    super(`Já existe uma conta vinculada ao documento "${document}".`)
  }
}

export class SameAccountTransferError extends DomainError {
  constructor() {
    super('Não é possível transferir valores entre a mesma conta de origem e destino.')
  }
}
