import { randomUUID } from 'node:crypto'
import { Money } from '../value-objects/Money'
import { Document } from '../value-objects/Document'
import { InsufficientFundsError, InvalidAmountError } from '../errors'

export interface AccountProps {
  id: string
  document: Document
  ownerName: string
  balance: Money
  createdAt: Date
}

/**
 * Entidade `Account`.
 *
 * Esta é a "Regra de Ouro" do projeto: TODA a lógica de débito/crédito,
 * incluindo a validação de saldo suficiente, vive AQUI - dentro da
 * entidade. Nenhuma rota, controller ou caso de uso pode mexer no saldo
 * diretamente; eles só podem chamar `credit()` ou `debit()`, e a entidade
 * decide se a operação é permitida.
 *
 * Isso garante que, independentemente de quantos pontos de entrada o
 * sistema tenha (transferência, depósito, saque, cashback, etc.), a regra
 * "não é possível sacar mais do que se tem" é aplicada de forma única e
 * consistente.
 */
export class Account {
  private constructor(private props: AccountProps) {}

  /** Abre uma nova conta. Toda conta nasce com saldo ZERO, conforme as regras de negócio. */
  static open(params: { document: Document; ownerName: string; id?: string }): Account {
    return new Account({
      id: params.id ?? randomUUID(),
      document: params.document,
      ownerName: params.ownerName,
      balance: Money.zero(),
      createdAt: new Date(),
    })
  }

  /** Reconstrói uma conta já existente a partir de dados persistidos (usado pelos repositórios). */
  static restore(props: AccountProps): Account {
    return new Account(props)
  }

  get id(): string {
    return this.props.id
  }

  get document(): Document {
    return this.props.document
  }

  get ownerName(): string {
    return this.props.ownerName
  }

  get balance(): Money {
    return this.props.balance
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  /**
   * Credita (adiciona) um valor ao saldo da conta.
   * Usado em depósitos, recebimento de transferências e cashback.
   */
  credit(amount: Money): void {
    if (!amount.isPositive()) {
      throw new InvalidAmountError('O valor a ser creditado deve ser positivo.')
    }
    this.props.balance = this.props.balance.add(amount)
  }

  /**
   * Debita (remove) um valor do saldo da conta.
   *
   * Lança `InsufficientFundsError` se o saldo atual for menor que o valor
   * solicitado - é AQUI, e somente aqui, que essa regra é validada.
   */
  debit(amount: Money): void {
    if (!amount.isPositive()) {
      throw new InvalidAmountError('O valor a ser debitado deve ser positivo.')
    }

    if (this.props.balance.isLessThan(amount)) {
      throw new InsufficientFundsError(this.props.id)
    }

    this.props.balance = this.props.balance.subtract(amount)
  }

  /** Indica se a conta tem saldo suficiente para um débito de `amount`. */
  hasSufficientBalance(amount: Money): boolean {
    return this.props.balance.isGreaterThanOrEqual(amount)
  }
}
