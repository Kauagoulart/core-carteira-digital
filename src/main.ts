import 'dotenv/config'
import { buildServer } from './presentation/http/server'
import { AccountController } from './presentation/http/controllers/AccountController'
import { TransferController } from './presentation/http/controllers/TransferController'

import { CreateAccountUseCase } from './application/use-cases/CreateAccountUseCase'
import { DepositUseCase } from './application/use-cases/DepositUseCase'
import { WithdrawUseCase } from './application/use-cases/WithdrawUseCase'
import { CashbackUseCase } from './application/use-cases/CashbackUseCase'
import { GetAccountStatementUseCase } from './application/use-cases/GetAccountStatementUseCase'
import { TransferFundsUseCase } from './application/use-cases/TransferFundsUseCase'

import { PrismaAccountRepository } from './infrastructure/repositories/PrismaAccountRepository'
import { PrismaTransactionRepository } from './infrastructure/repositories/PrismaTransactionRepository'
import { PrismaUnitOfWork } from './infrastructure/repositories/PrismaUnitOfWork'

/**
 * COMPOSITION ROOT.
 *
 * Este é o ÚNICO lugar do projeto que conhece TODAS as camadas ao mesmo
 * tempo: aqui (e somente aqui) escolhemos as implementações concretas
 * (Prisma) e as injetamos nos Casos de Uso através das interfaces de
 * domínio (`IAccountRepository`, `ITransactionRepository`, `IUnitOfWork`).
 *
 * Trocar Prisma -> outra ORM, ou SQLite -> Postgres, exige alterar
 * APENAS este arquivo (e as classes dentro de `infrastructure/`) - todo
 * o restante do sistema (domain, application, presentation) permanece
 * inalterado, graças ao DIP.
 */

// --- Infraestrutura (implementações concretas) ---
const accountRepository = new PrismaAccountRepository()
const transactionRepository = new PrismaTransactionRepository()
const unitOfWork = new PrismaUnitOfWork()

// --- Casos de uso (Application Layer) ---
const createAccountUseCase = new CreateAccountUseCase(accountRepository)
const depositUseCase = new DepositUseCase(accountRepository, transactionRepository)
const withdrawUseCase = new WithdrawUseCase(accountRepository, transactionRepository)
const cashbackUseCase = new CashbackUseCase(accountRepository, transactionRepository)
const getAccountStatementUseCase = new GetAccountStatementUseCase(accountRepository, transactionRepository)
const transferFundsUseCase = new TransferFundsUseCase(accountRepository, unitOfWork)

// --- Controllers (Presentation Layer) ---
const accountController = new AccountController(
  createAccountUseCase,
  depositUseCase,
  withdrawUseCase,
  cashbackUseCase,
  getAccountStatementUseCase
)
const transferController = new TransferController(transferFundsUseCase)

const app = buildServer({ accountController, transferController })

const PORT = Number(process.env.PORT ?? 3000)

app.listen(PORT, () => {
  console.log(`🏦 Core bancário rodando em http://localhost:${PORT}`)
})
