import { Request, Response } from 'express'
import { TransferFundsUseCase } from '../../../application/use-cases/TransferFundsUseCase'

/**
 * Controller responsável APENAS pela rota de transferência.
 *
 * `POST /transfer` apenas recebe o JSON, repassa para o
 * `TransferFundsUseCase` e devolve o resultado. Toda a inteligência
 * (busca de contas, débito, crédito, persistência atômica) está no Caso
 * de Uso - o controller não tem NENHUMA regra de negócio.
 */
export class TransferController {
  constructor(private readonly transferFundsUseCase: TransferFundsUseCase) {}

  transfer = async (req: Request, res: Response) => {
    const { originAccountId, destinationAccountId, amountInCents, description } = req.body

    const result = await this.transferFundsUseCase.execute({
      originAccountId,
      destinationAccountId,
      amountInCents,
      description,
    })

    return res.status(200).json(result)
  }
}
