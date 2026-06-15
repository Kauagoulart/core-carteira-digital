import { describe, it, expect } from 'vitest'
import { Account } from '../../src/domain/entities/Account'
import { Document } from '../../src/domain/value-objects/Document'
import { Money } from '../../src/domain/value-objects/Money'
import { InsufficientFundsError, InvalidAmountError } from '../../src/domain/errors'

describe('Account (Entity)', () => {
  const document = Document.create('529.982.247-25')

  it('nasce sempre com saldo zero', () => {
    const account = Account.open({ document, ownerName: 'Ana' })

    expect(account.balance.isZero()).toBe(true)
  })

  it('credit() aumenta o saldo', () => {
    const account = Account.open({ document, ownerName: 'Ana' })

    account.credit(Money.fromReais(100))

    expect(account.balance.toReais()).toBe(100)
  })

  it('debit() reduz o saldo quando há saldo suficiente', () => {
    const account = Account.open({ document, ownerName: 'Ana' })
    account.credit(Money.fromReais(100))

    account.debit(Money.fromReais(40))

    expect(account.balance.toReais()).toBe(60)
  })

  it('REGRA DE OURO: debit() lança InsufficientFundsError se o saldo for insuficiente', () => {
    const account = Account.open({ document, ownerName: 'Ana' })
    account.credit(Money.fromReais(50))

    expect(() => account.debit(Money.fromReais(100))).toThrow(InsufficientFundsError)

    // O saldo NÃO deve ser alterado quando a operação falha.
    expect(account.balance.toReais()).toBe(50)
  })

  it('rejeita débito/crédito de valores zero ou negativos', () => {
    const account = Account.open({ document, ownerName: 'Ana' })
    account.credit(Money.fromReais(50))

    expect(() => account.credit(Money.fromReais(0))).toThrow(InvalidAmountError)
    expect(() => account.debit(Money.fromReais(0))).toThrow(InvalidAmountError)
  })

  it('hasSufficientBalance() reflete corretamente o saldo disponível', () => {
    const account = Account.open({ document, ownerName: 'Ana' })
    account.credit(Money.fromReais(100))

    expect(account.hasSufficientBalance(Money.fromReais(100))).toBe(true)
    expect(account.hasSufficientBalance(Money.fromReais(100.01))).toBe(false)
  })
})
