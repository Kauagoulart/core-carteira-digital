import { Request, Response } from 'express'
import { CreateAccountUseCase } from '../../../application/use-cases/CreateAccountUseCase'
import { DepositUseCase } from '../../../application/use-cases/DepositUseCase'
import { WithdrawUseCase } from '../../../application/use-cases/WithdrawUseCase'
import { CashbackUseCase } from '../../../application/use-cases/CashbackUseCase'
import { GetAccountStatementUseCase } from '../../../application/use-cases/GetAccountStatementUseCase'

/**
 * Camada de Apresentação (HTTP).
 *
 * Os controllers fazem apenas três coisas:
 *   1. Extrair/validar o formato básico dos dados da requisição (req.body).
 *   2. Chamar o Caso de Uso correspondente.
 *   3. Traduzir o resultado para uma resposta HTTP (status + JSON).
 *
 * NENHUMA regra de negócio (saldo, validação de documento, etc.) vive aqui.
 * Erros de negócio são lançados pelos Casos de Uso/Entidades e tratados
 * centralmente pelo `errorHandler`.
 */
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly cashbackUseCase: CashbackUseCase,
    private readonly getAccountStatementUseCase: GetAccountStatementUseCase
  ) {}

  create = async (req: Request, res: Response) => {
    const { document, ownerName } = req.body

    const result = await this.createAccountUseCase.execute({
      documentValue: document,
      ownerName,
    })

    return res.status(201).json(result)
  }

  getStatement = async (req: Request, res: Response) => {
    const { accountId } = req.params

    const result = await this.getAccountStatementUseCase.execute({ accountId })

    return res.status(200).json(result)
  }

  deposit = async (req: Request, res: Response) => {
    const { accountId } = req.params
    const { amountInCents } = req.body

    const result = await this.depositUseCase.execute({ accountId, amountInCents })

    return res.status(200).json(result)
  }

  withdraw = async (req: Request, res: Response) => {
    const { accountId } = req.params
    const { amountInCents } = req.body

    const result = await this.withdrawUseCase.execute({ accountId, amountInCents })

    return res.status(200).json(result)
  }

  /**
   * Rota bônus que demonstra o OCP: um NOVO tipo de operação (cashback)
   * exposto sem qualquer alteração nas rotas/casos de uso de transferência.
   */
  cashback = async (req: Request, res: Response) => {
    const { accountId } = req.params
    const { amountInCents, description } = req.body

    const result = await this.cashbackUseCase.execute({ accountId, amountInCents, description })

    return res.status(200).json(result)
  }
}
