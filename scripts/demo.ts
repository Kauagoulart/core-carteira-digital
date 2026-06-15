import 'dotenv/config'
import { PrismaAccountRepository } from '../src/infrastructure/repositories/PrismaAccountRepository'
import { PrismaTransactionRepository } from '../src/infrastructure/repositories/PrismaTransactionRepository'
import { PrismaUnitOfWork } from '../src/infrastructure/repositories/PrismaUnitOfWork'
import { prisma } from '../src/infrastructure/prisma/client'

import { CreateAccountUseCase } from '../src/application/use-cases/CreateAccountUseCase'
import { DepositUseCase } from '../src/application/use-cases/DepositUseCase'
import { WithdrawUseCase } from '../src/application/use-cases/WithdrawUseCase'
import { CashbackUseCase } from '../src/application/use-cases/CashbackUseCase'
import { TransferFundsUseCase } from '../src/application/use-cases/TransferFundsUseCase'
import { GetAccountStatementUseCase } from '../src/application/use-cases/GetAccountStatementUseCase'

import { Document } from '../src/domain/value-objects/Document'
import { DocumentAlreadyInUseError, InsufficientFundsError } from '../src/domain/errors'

/**
 * SCRIPT DE DEMONSTRAÇÃO.
 *
 * Executa um fluxo completo de operações bancárias usando AS MESMAS
 * implementações concretas (Prisma) que rodam atrás da API HTTP - ou seja,
 * tudo aqui é GRAVADO no banco SQLite (`prisma/dev.db`), para que o
 * professor possa abrir `npx prisma studio` e ver os dados reais.
 *
 * Como rodar:
 *   npx prisma generate
 *   npx prisma migrate dev --name init
 *   npm run demo
 *
 * O script é reexecutável: se as contas de demonstração já existirem
 * (mesmo CPF/CNPJ), ele reaproveita as contas existentes em vez de falhar.
 */

const accountRepository = new PrismaAccountRepository()
const transactionRepository = new PrismaTransactionRepository()
const unitOfWork = new PrismaUnitOfWork()

const createAccountUseCase = new CreateAccountUseCase(accountRepository)
const depositUseCase = new DepositUseCase(accountRepository, transactionRepository)
const withdrawUseCase = new WithdrawUseCase(accountRepository, transactionRepository)
const cashbackUseCase = new CashbackUseCase(accountRepository, transactionRepository)
const transferFundsUseCase = new TransferFundsUseCase(accountRepository, unitOfWork)
const getAccountStatementUseCase = new GetAccountStatementUseCase(accountRepository, transactionRepository)

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function section(title: string) {
  console.log('\n' + '─'.repeat(60))
  console.log(`▶ ${title}`)
  console.log('─'.repeat(60))
}

/** Cria a conta de demonstração, ou reutiliza se o documento já estiver cadastrado. */
async function getOrCreateAccount(documentValue: string, ownerName: string) {
  try {
    const result = await createAccountUseCase.execute({ documentValue, ownerName })
    console.log(`✅ Conta criada: ${ownerName} (${result.document}) -> id=${result.accountId}`)
    return result.accountId
  } catch (error) {
    if (error instanceof DocumentAlreadyInUseError) {
      const document = Document.create(documentValue)
      const existing = await accountRepository.findByDocument(document)
      console.log(`ℹ️  Conta já existia: ${ownerName} (${document.format()}) -> id=${existing!.id}`)
      return existing!.id
    }
    throw error
  }
}

async function printStatement(accountId: string, label: string) {
  const statement = await getAccountStatementUseCase.execute({ accountId })

  console.log(`\n📄 Extrato de ${label} (${statement.ownerName} - ${statement.document})`)
  console.log(`   Saldo atual: ${formatBRL(statement.balance)}`)
  for (const tx of statement.transactions) {
    const sign = tx.destinationAccountId === accountId ? '+' : '-'
    console.log(
      `   ${tx.createdAt.toISOString()} | ${tx.type.padEnd(10)} | ${sign}${formatBRL(tx.amount)} | ${tx.description ?? ''}`
    )
  }
}

async function main() {
  console.log('🏦 Demonstração do Core Bancário - Carteira Digital')
  console.log('   (todas as operações abaixo são persistidas no SQLite em prisma/dev.db)')

  section('1. Abertura de contas (saldo inicial = R$ 0,00)')
  const aliceId = await getOrCreateAccount('529.982.247-25', 'Alice')
  const bobId = await getOrCreateAccount('11.444.777/0001-61', 'Bob')

  section('2. Depósito inicial')
  const aliceAfterDeposit = await depositUseCase.execute({ accountId: aliceId, amountInCents: 50_000 })
  console.log(`💰 Alice depositou R$ 500,00. Novo saldo: ${formatBRL(aliceAfterDeposit.newBalance)}`)

  section('3. Transferência (PIX interno) - Alice -> Bob')
  const transfer = await transferFundsUseCase.execute({
    originAccountId: aliceId,
    destinationAccountId: bobId,
    amountInCents: 15_000,
    description: 'Pagamento de aluguel',
  })
  console.log(`🔁 Transferência concluída (id=${transfer.transactionId})`)
  console.log(`   Saldo Alice: ${formatBRL(transfer.originBalance)}`)
  console.log(`   Saldo Bob:   ${formatBRL(transfer.destinationBalance)}`)

  section('4. REGRA DE OURO - tentativa de transferência com saldo insuficiente')
  try {
    await transferFundsUseCase.execute({
      originAccountId: bobId,
      destinationAccountId: aliceId,
      amountInCents: 999_999_999, // muito maior do que o saldo de Bob
      description: 'Tentativa inválida',
    })
  } catch (error) {
    if (error instanceof InsufficientFundsError) {
      console.log(`🚫 Bloqueado como esperado: ${error.message}`)
      console.log('   Nenhum saldo foi alterado e nenhuma transação foi registrada.')
    } else {
      throw error
    }
  }

  section('5. Saque')
  const withdraw = await withdrawUseCase.execute({ accountId: aliceId, amountInCents: 5_000 })
  console.log(`🏧 Alice sacou R$ 50,00. Novo saldo: ${formatBRL(withdraw.newBalance)}`)

  section('6. Cashback (demonstração do OCP - novo tipo de transação)')
  const cashback = await cashbackUseCase.execute({
    accountId: bobId,
    amountInCents: 1_000,
    description: 'Cashback de compra no débito',
  })
  console.log(`🎁 Bob recebeu cashback de R$ 10,00. Novo saldo: ${formatBRL(cashback.newBalance)}`)

  section('7. Extratos finais')
  await printStatement(aliceId, 'Alice')
  await printStatement(bobId, 'Bob')

  console.log('\n✅ Demonstração concluída! Abra "npx prisma studio" para inspecionar o banco SQLite.')
}

main()
  .catch((error) => {
    console.error('\n❌ Erro inesperado durante a demonstração:')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
