import { InvalidDocumentError } from '../errors'

export type DocumentType = 'CPF' | 'CNPJ'

/**
 * Value Object que representa um documento de identificação (CPF ou CNPJ).
 *
 * Garante, na fronteira do domínio, que NENHUMA conta possa ser criada com
 * um documento mal formatado ou com dígitos verificadores inválidos. Uma
 * vez que um `Document` exista, ele é garantidamente válido - o restante
 * do sistema não precisa (e não deve) revalidar isso.
 */
export class Document {
  private readonly digits: string
  private readonly type: DocumentType

  private constructor(digits: string, type: DocumentType) {
    this.digits = digits
    this.type = type
  }

  /**
   * Cria um Document a partir de uma string qualquer (com ou sem máscara).
   * Lança `InvalidDocumentError` se o documento não tiver 11 (CPF) ou 14
   * (CNPJ) dígitos, ou se os dígitos verificadores não baterem.
   */
  static create(rawValue: string): Document {
    const digits = (rawValue ?? '').replace(/\D/g, '')

    if (digits.length === 11) {
      if (!Document.isValidCPF(digits)) {
        throw new InvalidDocumentError(rawValue)
      }
      return new Document(digits, 'CPF')
    }

    if (digits.length === 14) {
      if (!Document.isValidCNPJ(digits)) {
        throw new InvalidDocumentError(rawValue)
      }
      return new Document(digits, 'CNPJ')
    }

    throw new InvalidDocumentError(rawValue)
  }

  /** Apenas os dígitos, sem máscara. Usado como identificador único/chave. */
  get value(): string {
    return this.digits
  }

  get documentType(): DocumentType {
    return this.type
  }

  /** Retorna a representação formatada (ex: 123.456.789-09 ou 12.345.678/0001-95). */
  format(): string {
    if (this.type === 'CPF') {
      return this.digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return this.digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  equals(other: Document): boolean {
    return this.digits === other.digits
  }

  private static isValidCPF(cpf: string): boolean {
    // Rejeita sequências como 000.000.000-00, 111.111.111-11, etc.
    if (/^(\d)\1{10}$/.test(cpf)) return false

    const calcCheckDigit = (length: number): number => {
      let sum = 0
      for (let i = 0; i < length; i++) {
        sum += parseInt(cpf[i], 10) * (length + 1 - i)
      }
      const remainder = (sum * 10) % 11
      return remainder === 10 ? 0 : remainder
    }

    const firstCheck = calcCheckDigit(9)
    const secondCheck = calcCheckDigit(10)

    return firstCheck === parseInt(cpf[9], 10) && secondCheck === parseInt(cpf[10], 10)
  }

  private static isValidCNPJ(cnpj: string): boolean {
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    const calcCheckDigit = (length: number): number => {
      const weights =
        length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

      let sum = 0
      for (let i = 0; i < length; i++) {
        sum += parseInt(cnpj[i], 10) * weights[i]
      }
      const remainder = sum % 11
      return remainder < 2 ? 0 : 11 - remainder
    }

    const firstCheck = calcCheckDigit(12)
    const secondCheck = calcCheckDigit(13)

    return firstCheck === parseInt(cnpj[12], 10) && secondCheck === parseInt(cnpj[13], 10)
  }
}
