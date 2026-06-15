import { describe, it, expect } from 'vitest'
import { Document } from '../../src/domain/value-objects/Document'
import { InvalidDocumentError } from '../../src/domain/errors'

describe('Document (Value Object - CPF/CNPJ)', () => {
  it('aceita um CPF válido (com ou sem máscara)', () => {
    // CPF válido conhecido para testes
    const doc1 = Document.create('529.982.247-25')
    const doc2 = Document.create('52998224725')

    expect(doc1.documentType).toBe('CPF')
    expect(doc1.value).toBe('52998224725')
    expect(doc1.equals(doc2)).toBe(true)
    expect(doc1.format()).toBe('529.982.247-25')
  })

  it('aceita um CNPJ válido (com ou sem máscara)', () => {
    // CNPJ válido conhecido para testes
    const doc = Document.create('11.444.777/0001-61')

    expect(doc.documentType).toBe('CNPJ')
    expect(doc.value).toBe('11444777000161')
    expect(doc.format()).toBe('11.444.777/0001-61')
  })

  it('rejeita CPF com dígitos verificadores inválidos', () => {
    expect(() => Document.create('111.111.111-11')).toThrow(InvalidDocumentError)
    expect(() => Document.create('123.456.789-00')).toThrow(InvalidDocumentError)
  })

  it('rejeita strings com tamanho inválido', () => {
    expect(() => Document.create('123')).toThrow(InvalidDocumentError)
    expect(() => Document.create('')).toThrow(InvalidDocumentError)
  })
})
