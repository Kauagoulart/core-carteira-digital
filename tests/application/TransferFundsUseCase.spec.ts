import { describe, it, expect, beforeEach } from 'vitest'
import { TransferFundsUseCase } from '../../src/application/use-cases/TransferFundsUseCase'
import { CreateAccountUseCase } from '../../src/application/use-cases/CreateAccountUseCase'
import { DepositUseCase } from '../../src/application/use-cases/DepositUseCase'
import { InMemoryAccountRepository } from '../../src/infrastructure/repositories/in-memory/InMemoryAccountRepository'
import { InMemoryTransactionRepository } from '../../src/infrastructure/repositories/in-memory/InMemoryTransactionRepository'
import { InMemoryUnitOfWork } from '../../src/infrastructure/repositories/in-memory/InMemoryUnitOfWork'
import { InsufficientFundsError, SameAccountTransferError, AccountNotFoundError } from '../../src/domain/errors'

describe('TransferFundsUseCase', () => {
  let accountRepository: InMemoryAccountRepository
  let transactionRepository: InMemoryTransactionRepository
  let unitOfWork: InMemoryUnitOfWork

  let createAccountUseCase: CreateAccountUseCase
  let depositUseCase: DepositUseCase
  let transferFundsUseCase: TransferFundsUseCase

  let aliceId: string
  let bobId: string

  beforeEach(async () => {
    accountRepository = new InMemoryAccountRepository()
    transactionRepository = new InMemoryTransactionRepository()
    unitOfWork = new InMemoryUnitOfWork(accountRepository, transactionRepository)

    createAccountUseCase = new CreateAccountUseCase(accountRepository)
    depositUseCase = new DepositUseCase(accountRepository, transactionRepository)
    transferFundsUseCase = new TransferFundsUseCase(accountRepository, unitOfWork)

    const alice = await createAccountUseCase.execute({
      documentValue: '529.982.247-25',
      ownerName: 'Alice',
    })
    const bob = await createAccountUseCase.execute({
      documentValue: '11.444.777/0001-61',
      ownerName: 'Bob',
    })

    aliceId = alice.accountId
    bobId = bob.accountId

    // Alice começa com R$ 100,00
    await depositUseCase.execute({ accountId: aliceId, amountInCents: 10_000 })
  })

  it('transfere valor da conta origem para a conta destino', async () => {
    const result = await transferFundsUseCase.execute({
      originAccountId: aliceId,
      destinationAccountId: bobId,
      amountInCents: 3_000, // R$ 30,00
    })

    expect(result.originBalance).toBe(70)
    expect(result.destinationBalance).toBe(30)

    const alice = await accountRepository.findById(aliceId)
    const bob = await accountRepository.findById(bobId)

    expect(alice!.balance.toReais()).toBe(70)
    expect(bob!.balance.toReais()).toBe(30)
  })

  it('CONSERVAÇÃO DE SALDO: a soma total do sistema permanece constante após a transferência', async () => {
    const totalBefore =
      (await accountRepository.findById(aliceId))!.balance.getCents() +
      (await accountRepository.findById(bobId))!.balance.getCents()

    await transferFundsUseCase.execute({
      originAccountId: aliceId,
      destinationAccountId: bobId,
      amountInCents: 4_321,
    })

    const totalAfter =
      (await accountRepository.findById(aliceId))!.balance.getCents() +
      (await accountRepository.findById(bobId))!.balance.getCents()

    expect(totalAfter).toBe(totalBefore)
  })

  it('REGRA DE OURO: não permite transferir mais do que o saldo disponível', async () => {
    await expect(
      transferFundsUseCase.execute({
        originAccountId: aliceId,
        destinationAccountId: bobId,
        amountInCents: 100_000, // R$ 1.000,00 - Alice só tem R$ 100,00
      })
    ).rejects.toThrow(InsufficientFundsError)

    // Nenhum saldo deve ter sido alterado.
    const alice = await accountRepository.findById(aliceId)
    const bob = await accountRepository.findById(bobId)

    expect(alice!.balance.toReais()).toBe(100)
    expect(bob!.balance.toReais()).toBe(0)

    // E nenhuma transação deve ter sido registrada.
    expect(await transactionRepository.findByAccountId(aliceId)).toHaveLength(1) // só o depósito inicial
  })

  it('não permite transferência entre a mesma conta', async () => {
    await expect(
      transferFundsUseCase.execute({
        originAccountId: aliceId,
        destinationAccountId: aliceId,
        amountInCents: 1_000,
      })
    ).rejects.toThrow(SameAccountTransferError)
  })

  it('lança AccountNotFoundError se a conta de destino não existir', async () => {
    await expect(
      transferFundsUseCase.execute({
        originAccountId: aliceId,
        destinationAccountId: 'non-existent-id',
        amountInCents: 1_000,
      })
    ).rejects.toThrow(AccountNotFoundError)
  })

  it('registra uma transação do tipo TRANSFER após o sucesso', async () => {
    const result = await transferFundsUseCase.execute({
      originAccountId: aliceId,
      destinationAccountId: bobId,
      amountInCents: 1_000,
    })

    const transaction = await transactionRepository.findById(result.transactionId)

    expect(transaction).not.toBeNull()
    expect(transaction!.type).toBe('TRANSFER')
    expect(transaction!.amount.toReais()).toBe(10)
    expect(transaction!.originAccountId).toBe(aliceId)
    expect(transaction!.destinationAccountId).toBe(bobId)
  })
})
