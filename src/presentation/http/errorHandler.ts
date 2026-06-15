import { NextFunction, Request, Response } from 'express'
import {
  AccountNotFoundError,
  DocumentAlreadyInUseError,
  InsufficientFundsError,
  InvalidAmountError,
  InvalidDocumentError,
  SameAccountTransferError,
} from '../../domain/errors'

/**
 * Middleware central de tratamento de erros.
 *
 * Esta é a ÚNICA peça do sistema que sabe traduzir um erro de DOMÍNIO
 * (ex: `InsufficientFundsError`) para um status code HTTP (ex: 422).
 * As rotas e os Casos de Uso não conhecem HTTP, então eles apenas lançam
 * (`throw`) os erros de domínio - este middleware os captura.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (
    err instanceof InvalidAmountError ||
    err instanceof InvalidDocumentError ||
    err instanceof SameAccountTransferError
  ) {
    return res.status(400).json({ error: err.name, message: err.message })
  }

  if (err instanceof AccountNotFoundError) {
    return res.status(404).json({ error: err.name, message: err.message })
  }

  if (err instanceof DocumentAlreadyInUseError) {
    return res.status(409).json({ error: err.name, message: err.message })
  }

  if (err instanceof InsufficientFundsError) {
    return res.status(422).json({ error: err.name, message: err.message })
  }

  console.error(err)
  return res.status(500).json({ error: 'InternalServerError', message: 'Erro interno do servidor.' })
}

/**
 * Wrapper para handlers async do Express, evitando repetir try/catch em
 * cada controller. Qualquer erro lançado dentro do handler é encaminhado
 * para o `errorHandler`.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}
