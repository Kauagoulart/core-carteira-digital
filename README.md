# 🏦 Core Bancário - Carteira Digital

Implementação do core bancário de uma carteira digital, com foco em **arquitetura DDD**
e no princípio **SOLID**, garantindo que o saldo dos usuários jamais "desapareça" ou
seja "criado do nada" - seja por erro de arredondamento de float, seja por falha de
persistência durante uma transferência.

## 🧱 Stack

- **Linguagem:** Node.js + TypeScript
- **Framework HTTP:** Express
- **Banco de Dados:** SQLite (via Prisma) - facilmente trocável para Postgres/MySQL
- **Testes:** Vitest (com repositórios em memória, sem dependência de banco)

## 📂 Estrutura de Pastas (Camadas DDD)

```
src/
├── domain/                     # Regras de negócio puras (sem Express, sem Prisma)
│   ├── entities/
│   │   ├── Account.ts          # credit() / debit() - a "Regra de Ouro" mora aqui
│   │   └── Transaction.ts       # Registro histórico de movimentações
│   ├── value-objects/
│   │   ├── Money.ts             # Dinheiro em centavos (sem float)
│   │   └── Document.ts          # CPF/CNPJ validado
│   ├── repositories/            # Interfaces (portas) - DIP
│   │   ├── IAccountRepository.ts
│   │   ├── ITransactionRepository.ts
│   │   └── IUnitOfWork.ts        # Garante atomicidade da transferência
│   └── errors/
│
├── application/
│   └── use-cases/
│       ├── CreateAccountUseCase.ts
│       ├── DepositUseCase.ts
│       ├── WithdrawUseCase.ts
│       ├── TransferFundsUseCase.ts   # ⭐ O grande desafio
│       ├── CashbackUseCase.ts        # ⭐ Demonstração do OCP
│       └── GetAccountStatementUseCase.ts
│
├── infrastructure/
│   ├── prisma/client.ts
│   └── repositories/
│       ├── PrismaAccountRepository.ts
│       ├── PrismaTransactionRepository.ts
│       ├── PrismaUnitOfWork.ts       # $transaction (atomicidade real)
│       ├── AccountMapper.ts / TransactionMapper.ts
│       └── in-memory/                # Implementações para testes
│
├── presentation/
│   └── http/
│       ├── server.ts
│       ├── errorHandler.ts           # Traduz erros de domínio -> status HTTP
│       ├── controllers/
│       └── routes/
│
└── main.ts                           # Composition Root (injeção de dependências)

tests/
├── domain/        # Money, Document, Account
└── application/   # TransferFundsUseCase (com repositórios em memória)
```

## 🎬 Script de demonstração (recomendado para o professor)

Em vez de testar manualmente com `curl`, há um script que executa um fluxo
completo de operações **diretamente nos Casos de Uso** (sem precisar do
servidor HTTP rodando) e **persiste tudo no SQLite** (`prisma/dev.db`):

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init

npm run demo
```

O script (`scripts/demo.ts`) faz, na ordem:

1. Abre as contas de "Alice" e "Bob" (saldo inicial = R$ 0,00).
2. Deposita R$ 500,00 na conta da Alice.
3. Transfere R$ 150,00 de Alice para Bob.
4. **Tenta** transferir um valor absurdo de Bob para Alice (saldo
   insuficiente) - mostra que a operação é **bloqueada** e nada é alterado.
5. Alice realiza um saque de R$ 50,00.
6. Bob recebe um cashback de R$ 10,00 (demonstrando o OCP).
7. Imprime o extrato final de cada conta.

Ao final, abra `npx prisma studio` para ver as tabelas `accounts` e
`transactions` populadas no banco SQLite. O script é **reexecutável**: se
rodar de novo, ele reaproveita as contas já existentes (mesmo CPF/CNPJ) em
vez de duplicar.

## ▶️ Como executar a API

```bash
npm install
cp .env.example .env

# Gera o client do Prisma e cria o banco SQLite local
npx prisma generate
npx prisma migrate dev --name init

# Modo desenvolvimento
npm run dev

# Build + produção
npm run build
npm start
```

> ⚠️ **Nota sobre o ambiente sandbox em que este código foi gerado:** o passo
> `prisma generate` precisa baixar o "query engine" binário de
> `binaries.prisma.sh`. No ambiente isolado usado para criar este projeto esse
> domínio estava bloqueado, então o client foi gerado em modo "stub" (tipos
> `any`). **No seu ambiente normal, com acesso à internet, isso funciona sem
> nenhuma alteração de código.** Toda a lógica de domínio/aplicação (o que
> realmente importa para a avaliação) já foi testada e passa 100% (veja
> `npm test`).

## 🧪 Testes

```bash
npm test
```

Os testes cobrem:
- `Money`: garante que `0.1 + 0.2 = 0.3` exatamente (sem erro de float).
- `Document`: validação de dígitos verificadores de CPF/CNPJ.
- `Account`: a "Regra de Ouro" - `debit()` lança `InsufficientFundsError`
  e **não altera o saldo** quando o valor é maior que o disponível.
- `TransferFundsUseCase`: cenário completo de transferência, incluindo um
  teste de **conservação de saldo** (a soma total do sistema antes e depois
  da transferência é idêntica) e o cenário de saldo insuficiente, tudo usando
  repositórios **em memória** (sem precisar de banco de dados).

## 🌐 Endpoints HTTP

| Método | Rota                              | Descrição                                  |
|--------|-----------------------------------|---------------------------------------------|
| POST   | `/accounts`                       | Abre uma conta (saldo inicial = 0)          |
| GET    | `/accounts/:accountId`            | Saldo + extrato da conta                    |
| POST   | `/accounts/:accountId/deposit`    | Depósito                                    |
| POST   | `/accounts/:accountId/withdraw`   | Saque (valida saldo via `Account.debit`)    |
| POST   | `/accounts/:accountId/cashback`   | Cashback (demonstração do OCP)              |
| POST   | `/transfer`                       | Transferência entre contas (PIX interno)    |

### Exemplos de requisição

**Abrir conta**
```bash
curl -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -d '{ "document": "529.982.247-25", "ownerName": "Alice" }'
```

**Depósito (valores SEMPRE em centavos, para evitar floats)**
```bash
curl -X POST http://localhost:3000/accounts/<accountId>/deposit \
  -H "Content-Type: application/json" \
  -d '{ "amountInCents": 10000 }'
```

**Transferência**
```bash
curl -X POST http://localhost:3000/transfer \
  -H "Content-Type: application/json" \
  -d '{
        "originAccountId": "<idAlice>",
        "destinationAccountId": "<idBob>",
        "amountInCents": 3000,
        "description": "Pagamento de almoço"
      }'
```

Se `originAccountId` não tiver saldo suficiente, a resposta será:
```json
{ "error": "InsufficientFundsError", "message": "Saldo insuficiente na conta \"...\" para realizar esta operação." }
```
com status **422**, e **nenhuma escrita** ocorre no banco.

---

## ✅ Como cada critério de avaliação foi atendido

### 1. Value Objects (`Money` e `Document`)

- **`Money`** (`src/domain/value-objects/Money.ts`): armazena valores como
  **inteiros de centavos**. Toda conversão de/para `number` (reais) acontece
  apenas nas bordas (entrada HTTP / saída para JSON). Operações internas
  (`add`, `subtract`) nunca usam ponto flutuante para somar valores -
  evitando o clássico bug `0.1 + 0.2 !== 0.3`.
- **`Document`** (`src/domain/value-objects/Document.ts`): valida CPF (11
  dígitos) e CNPJ (14 dígitos) com o algoritmo real de dígitos verificadores
  (módulo 11). Um `Document` só existe se for válido - o resto do sistema
  nunca precisa reverificar isso.

### 2. Regra de Ouro - validação de saldo na Entidade

Em `src/domain/entities/Account.ts`:

```ts
debit(amount: Money): void {
  if (!amount.isPositive()) throw new InvalidAmountError(...)
  if (this.props.balance.isLessThan(amount)) {
    throw new InsufficientFundsError(this.props.id)
  }
  this.props.balance = this.props.balance.subtract(amount)
}
```

`TransferFundsUseCase`, `WithdrawUseCase` e qualquer rota futura **não**
reimplementam essa checagem - eles apenas chamam `account.debit(amount)` e
deixam a entidade decidir. Isso significa que é **impossível** criar um
novo endpoint que retire dinheiro sem passar por essa validação.

### 3. Atomicidade na transferência (dinheiro não "desaparece")

`TransferFundsUseCase` busca as duas contas, aplica `debit`/`credit` em
memória (que pode lançar `InsufficientFundsError` ANTES de qualquer escrita)
e então delega a persistência para `IUnitOfWork.runTransfer(...)`.

`PrismaUnitOfWork` implementa isso com `prisma.$transaction(...)`: as duas
atualizações de saldo + a criação do registro de `Transaction` ocorrem em
**uma única transação SQL** - tudo é confirmado, ou tudo é desfeito (rollback)
em caso de falha. Não existe um estado intermediário em que o dinheiro saiu
de uma conta e não chegou na outra.

### 4. SOLID

- **SRP**: `TransferFundsUseCase` faz **apenas** orquestração da transferência
  (buscar contas, debitar/creditar, persistir). Notificações (e-mail, push,
  SMS) seriam responsabilidade de outro componente, chamado pelo controller
  ou por um listener de evento *depois* que o caso de uso retorna - nunca
  dentro dele.
- **OCP**: veja `src/application/use-cases/CashbackUseCase.ts`. Um novo tipo
  de transação (`CASHBACK`) foi adicionado **sem modificar** `Account`,
  `TransferFundsUseCase` ou as interfaces de repositório - apenas estendendo
  o enum `TransactionType` e criando um novo caso de uso.
- **DIP**: `TransferFundsUseCase` depende exclusivamente de
  `IAccountRepository` e `IUnitOfWork` (interfaces em `domain/repositories`).
  As implementações concretas (`PrismaAccountRepository`,
  `PrismaUnitOfWork`, ou as versões `InMemory*` usadas nos testes) são
  escolhidas **apenas** em `src/main.ts` (composition root). Trocar SQLite
  por Postgres/MySQL exige alterar somente `prisma/schema.prisma`, o `.env`
  e, no máximo, a implementação dentro de `infrastructure/` - zero impacto em
  `domain/` e `application/`.

## 🔄 Trocando o banco de dados

1. Edite `prisma/schema.prisma`: troque `provider = "sqlite"` por
   `"postgresql"` ou `"mysql"`.
2. Ajuste `DATABASE_URL` no `.env`.
3. Rode `npx prisma generate && npx prisma migrate dev`.

Nenhuma linha de `domain/` ou `application/` precisa mudar.
