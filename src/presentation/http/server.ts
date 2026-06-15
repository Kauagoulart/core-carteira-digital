import express, { Express } from 'express'
import { AccountController } from './controllers/AccountController'
import { TransferController } from './controllers/TransferController'
import { buildAccountRoutes } from './routes/accountRoutes'
import { buildTransferRoutes } from './routes/transferRoutes'
import { errorHandler } from './errorHandler'

export interface ServerDependencies {
  accountController: AccountController
  transferController: TransferController
}

/**
 * Monta a aplicação Express.
 *
 * Esta função recebe os controllers já construídos (com seus respectivos
 * Casos de Uso e Repositórios injetados) - quem decide QUAIS implementações
 * concretas usar é o `main.ts` (composition root), nunca esta camada.
 */
export function buildServer({ accountController, transferController }: ServerDependencies): Express {
  const app = express()

  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  app.use(buildAccountRoutes(accountController))
  app.use(buildTransferRoutes(transferController))

  app.use(errorHandler)

  return app
}
