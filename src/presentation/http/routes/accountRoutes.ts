import { Router } from 'express'
import { AccountController } from '../controllers/AccountController'
import { asyncHandler } from '../errorHandler'

export function buildAccountRoutes(controller: AccountController): Router {
  const router = Router()

  router.post('/accounts', asyncHandler(controller.create))
  router.get('/accounts/:accountId', asyncHandler(controller.getStatement))
  router.post('/accounts/:accountId/deposit', asyncHandler(controller.deposit))
  router.post('/accounts/:accountId/withdraw', asyncHandler(controller.withdraw))
  router.post('/accounts/:accountId/cashback', asyncHandler(controller.cashback))

  return router
}
