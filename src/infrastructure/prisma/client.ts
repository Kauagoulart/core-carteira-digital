import { PrismaClient } from '@prisma/client'

/**
 * Singleton do PrismaClient.
 *
 * Mantido na camada de Infraestrutura - nenhum outro módulo do projeto
 * (domínio ou aplicação) importa o Prisma diretamente.
 */
export const prisma = new PrismaClient()
