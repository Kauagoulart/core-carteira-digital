import { describe, it, expect } from 'vitest'
import { Money } from '../../src/domain/value-objects/Money'
import { InvalidAmountError } from '../../src/domain/errors'

describe('Money (Value Object)', () => {
  it('converte reais para centavos sem erro de arredondamento', () => {
    const a = Money.fromReais(0.1)
    const b = Money.fromReais(0.2)

    // Em JS puro, 0.1 + 0.2 === 0.30000000000000004
    expect(a.add(b).toReais()).toBe(0.3)
    expect(a.add(b).getCents()).toBe(30)
  })

  it('soma e subtração funcionam de forma exata', () => {
    const ten = Money.fromReais(10)
    const threeFifty = Money.fromReais(3.5)

    expect(ten.subtract(threeFifty).toReais()).toBe(6.5)
    expect(ten.add(threeFifty).toReais()).toBe(13.5)
  })

  it('zero() cria um valor zerado', () => {
    expect(Money.zero().isZero()).toBe(true)
    expect(Money.zero().getCents()).toBe(0)
  })

  it('compara valores corretamente', () => {
    const five = Money.fromReais(5)
    const ten = Money.fromReais(10)

    expect(ten.isGreaterThan(five)).toBe(true)
    expect(five.isLessThan(ten)).toBe(true)
    expect(five.equals(Money.fromReais(5))).toBe(true)
  })

  it('lança erro para valores não numéricos', () => {
    expect(() => Money.fromReais(NaN)).toThrow(InvalidAmountError)
  })

  it('subtração pode gerar valor negativo (usado internamente para validação)', () => {
    const five = Money.fromReais(5)
    const ten = Money.fromReais(10)

    const result = five.subtract(ten)
    expect(result.isNegative()).toBe(true)
    expect(result.getCents()).toBe(-500)
  })
})
