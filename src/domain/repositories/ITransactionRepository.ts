import { Transaction } from '../entities/Transaction'

/**
 * Porta (interface) para persistência do histórico de transações (extrato).
 *
 * Assim como `IAccountRepository`, os Casos de Uso conhecem apenas esta
 * interface - a implementação concreta vive na camada de Infraestrutura.
 */
export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>
  findById(id: string): Promise<Transaction | null>

  /** Retorna o extrato de uma conta (transações em que ela é origem ou destino), mais recentes primeiro. */
  findByAccountId(accountId: string): Promise<Transaction[]>
}
