import { Account } from '../entities/Account'
import { Transaction } from '../entities/Transaction'

export interface TransferPersistencePayload {
  origin: Account
  destination: Account
  transaction: Transaction
}

/**
 * Porta (interface) para garantir a ATOMICIDADE de operações que envolvem
 * mais de uma escrita no banco (ex: uma transferência precisa atualizar
 * DUAS contas e criar UM registro de transação).
 *
 * POR QUE ISSO EXISTE?
 * A "Regra de Ouro" do projeto diz que o dinheiro nunca pode "desaparecer".
 * Se debitarmos a conta de origem com sucesso, mas o sistema cair antes de
 * creditar a conta de destino, o dinheiro literalmente desapareceria do
 * sistema. Para evitar isso, todas as escritas de uma transferência
 * precisam ocorrer dentro de UMA ÚNICA transação de banco de dados:
 * tudo funciona, ou nada é alterado (rollback automático).
 *
 * O Caso de Uso (`TransferFundsUseCase`) NÃO sabe como essa atomicidade é
 * implementada (Prisma `$transaction`, transação SQL nativa, etc.) - ele
 * apenas chama `runTransfer(...)`. Isso preserva o DIP: a Aplicação
 * continua desconhecendo completamente o banco de dados.
 */
export interface IUnitOfWork {
  runTransfer(payload: TransferPersistencePayload): Promise<void>
}
