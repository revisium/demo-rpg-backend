# Prisma

## Setup

- PostgreSQL with `@prisma/adapter-pg`
- Schema: `prisma/schema.prisma`
- Generated client: `src/__generated__/client/`

## Common Commands

```bash
# Generate client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate:dev

# Apply migrations in production
npm run prisma:migrate:deploy

# Reset database (drop + recreate + seed)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

## Adding a New Model

1. Add model to `prisma/schema.prisma`
2. Run `npm run prisma:migrate:dev -- --name <migration-name>`
3. Run `npm run prisma:generate`
4. Add seed data if needed in `prisma/seed/seed.ts`

## Schema Conventions

```prisma
model MyModel {
  id        String   @id @default(nanoid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Fields...
  name String @db.VarChar(255)

  // Relations
  userId String
  user   User   @relation(fields: [userId], references: [id])

  // Indexes
  @@index([userId])
}
```

## Transactions

Use `TransactionPrismaService` for multi-step operations:

```typescript
const result = await this.transactionPrisma.run(async (tx) => {
  const task = await tx.task.create({ data: {...} });
  await tx.auditLog.create({ data: { taskId: task.id, ... } });
  return task;
});
```

### Serializable Transactions with Retry

For operations requiring strong consistency, use `TransactionPrismaService.run()`:

```typescript
const result = await this.transactionPrisma.run(async (tx) => {
  const task = await tx.task.create({ data: {...} });
  await tx.auditLog.create({ data: { taskId: task.id } });
  return task;
});
```

Features:
- **Serializable isolation** — prevents concurrent modification
- **Exponential backoff with jitter** — handles serialization failures
- **Configurable via env vars** — `TRANSACTION_MAX_RETRIES`, `TRANSACTION_BASE_DELAY_MS`, etc.
- **Retryable error detection** — PostgreSQL 40001, 40P01, Prisma P2034

See `ENV.md` for all transaction configuration options.

## PrismaService

Extends `PrismaClient` with lifecycle hooks:
- `onModuleInit()` — connects to database
- `onModuleDestroy()` — disconnects from database
