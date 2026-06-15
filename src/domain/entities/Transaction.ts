import { randomUUID } from 'node:crypto'
import { Money } from '../value-objects/Money'

/**
 * Tipos de transação suportados.
 *
 * OCP (Open/Closed Principle): para adicionar um novo tipo de transação
 * (ex: "CASHBACK"), basta adicionar um novo valor a este enum e criar um
 * novo Caso de Uso que monta um `Transaction.create({ type: 'CASHBACK', ... })`.
 * Nenhuma classe existente (Account, TransferFundsUseCase, repositórios)
 * precisa ser alterada para isso - veja `CashbackUseCase` como exemplo.
 */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  CASHBACK = 'CASHBACK',
}

export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface TransactionProps {
  id: string
  type: TransactionType
  amount: Money
  /** Conta de origem do dinheiro. `null` quando não houver origem (ex: depósito, cashback). */
  originAccountId: string | null
  /** Conta de destino do dinheiro. `null` quando não houver destino (ex: saque). */
  destinationAccountId: string | null
  status: TransactionStatus
  description?: string
  createdAt: Date
}

export type CreateTransactionInput = Omit<TransactionProps, 'id' | 'createdAt' | 'status'> & {
  id?: string
  status?: TransactionStatus
}

/**
 * Entidade `Transaction`.
 *
 * Representa o REGISTRO HISTÓRICO de uma movimentação financeira. É o
 * "extrato" - cada depósito, saque, transferência ou cashback gera uma
 * instância desta entidade, que é persistida pelo `ITransactionRepository`.
 *
 * Importante: a `Transaction` em si não move dinheiro - ela apenas
 * documenta que um movimento ocorreu. Quem efetivamente move o saldo são
 * os métodos `credit`/`debit` da entidade `Account`.
 */
export class Transaction {
  private constructor(private props: TransactionProps) {}

  static create(input: CreateTransactionInput): Transaction {
    return new Transaction({
      id: input.id ?? randomUUID(),
      type: input.type,
      amount: input.amount,
      originAccountId: input.originAccountId,
      destinationAccountId: input.destinationAccountId,
      status: input.status ?? TransactionStatus.COMPLETED,
      description: input.description,
      createdAt: new Date(),
    })
  }

  static restore(props: TransactionProps): Transaction {
    return new Transaction(props)
  }

  get id(): string {
    return this.props.id
  }

  get type(): TransactionType {
    return this.props.type
  }

  get amount(): Money {
    return this.props.amount
  }

  get originAccountId(): string | null {
    return this.props.originAccountId
  }

  get destinationAccountId(): string | null {
    return this.props.destinationAccountId
  }

  get status(): TransactionStatus {
    return this.props.status
  }

  get description(): string | undefined {
    return this.props.description
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
