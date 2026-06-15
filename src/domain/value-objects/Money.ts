import { InvalidAmountError } from '../errors'

/**
 * Value Object que representa um valor monetário.
 *
 * PROBLEMA QUE ELE RESOLVE:
 * Em JavaScript, `0.1 + 0.2 !== 0.3` por causa da representação de ponto
 * flutuante (IEEE 754). Fazer contas bancárias diretamente com `number`
 * (reais) é uma porta aberta para diferenças de centavos que, em escala,
 * fazem dinheiro "aparecer" ou "desaparecer".
 *
 * SOLUÇÃO:
 * Todo valor é armazenado internamente como um número INTEIRO de CENTAVOS.
 * Soma e subtração de inteiros em JS são exatas, então nunca há erro de
 * arredondamento nas operações internas do domínio.
 *
 * `Money` é imutável: toda operação retorna uma NOVA instância.
 */
export class Money {
  private readonly cents: number

  private constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new InvalidAmountError(
        'O valor monetário deve ser representado como um número inteiro de centavos.'
      )
    }
    this.cents = cents
  }

  /** Cria um Money a partir de um valor já em centavos (inteiro). Ex: 1050 = R$ 10,50 */
  static fromCents(cents: number): Money {
    return new Money(cents)
  }

  /**
   * Cria um Money a partir de um valor em reais (ex: 10.5 => R$ 10,50).
   * Esta é a ÚNICA fronteira onde aceitamos `number` de ponto flutuante
   * (normalmente vindo de um JSON da requisição HTTP). O valor é
   * imediatamente convertido e arredondado para um inteiro de centavos.
   */
  static fromReais(value: number): Money {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      throw new InvalidAmountError('Valor monetário inválido.')
    }
    return new Money(Math.round(value * 100))
  }

  static zero(): Money {
    return new Money(0)
  }

  /** Retorna o valor em centavos (inteiro) - útil para persistência. */
  getCents(): number {
    return this.cents
  }

  /** Retorna o valor em reais (float) - útil apenas para exibição/saída. */
  toReais(): number {
    return this.cents / 100
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents)
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents)
  }

  isNegative(): boolean {
    return this.cents < 0
  }

  isZero(): boolean {
    return this.cents === 0
  }

  isPositive(): boolean {
    return this.cents > 0
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.cents >= other.cents
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }

  toString(): string {
    const reais = (Math.abs(this.cents) / 100).toFixed(2).replace('.', ',')
    return `${this.cents < 0 ? '-' : ''}R$ ${reais}`
  }
}
