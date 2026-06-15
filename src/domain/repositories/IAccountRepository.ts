import { Account } from '../entities/Account'
import { Document } from '../value-objects/Document'

/**
 * Porta (interface) que o Domínio/Aplicação usa para persistir e buscar
 * contas, sem conhecer NADA sobre o banco de dados real (Prisma, Postgres,
 * SQLite, etc.).
 *
 * Isso é o DIP (Dependency Inversion Principle) em ação: os Casos de Uso
 * dependem desta abstração; a implementação concreta (`PrismaAccountRepository`,
 * `InMemoryAccountRepository`, ...) fica na camada de Infraestrutura e é
 * injetada em tempo de execução.
 */
export interface IAccountRepository {
  findById(id: string): Promise<Account | null>
  findByDocument(document: Document): Promise<Account | null>

  /** Persiste uma conta nova. */
  save(account: Account): Promise<void>

  /** Persiste alterações de saldo de uma conta já existente. */
  update(account: Account): Promise<void>
}
