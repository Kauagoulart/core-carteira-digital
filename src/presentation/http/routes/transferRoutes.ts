import { Router } from 'express'
import { TransferController } from '../controllers/TransferController'
import { asyncHandler } from '../errorHandler'

export function buildTransferRoutes(controller: TransferController): Router {
  const router = Router()

  router.post('/transfer', asyncHandler(controller.transfer))

  return router
}
