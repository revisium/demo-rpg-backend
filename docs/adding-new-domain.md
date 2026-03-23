# Adding a New Domain

Step-by-step checklist for adding a new domain (e.g., `project`).

## 1. Prisma Model

```prisma
// prisma/schema.prisma
model Project {
  id        String   @id @default(nanoid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  name      String   @db.VarChar(255)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId])
}
```

```bash
npm run prisma:migrate:dev -- --name add-project
npm run prisma:generate
```

## 2. Domain Module (CQRS)

Create `src/features/project/`:
- `project.module.ts`
- `project-api.service.ts` — **API service facade** (the ONLY public interface of the domain; wraps CommandBus + QueryBus; all resolvers, controllers, and MCP tools call this, never handlers directly)
- `commands/impl/create-project.command.ts`
- `commands/handlers/create-project.handler.ts`
- `commands/handlers/index.ts`
- `queries/impl/get-project.query.ts`
- `queries/handlers/get-project.handler.ts`
- `queries/handlers/index.ts`

See [CQRS docs](cqrs.md) for patterns.

## 3. Permissions

In `src/features/auth/types.ts`:
```typescript
export enum PermissionSubject {
  // ...existing
  Project = 'Project',
}
```

In `prisma/seed/seed.ts`, add permissions for the new subject.

## 4. GraphQL Resolver

Create `src/api/graphql-api/project/`:
- `models/project.model.ts`
- `inputs/create-project.input.ts`
- `project.resolver.ts`

Register in `api/graphql-api/graphql-api.module.ts`.

## 5. REST Controller

Create `src/api/rest-api/project/`:
- `dto/create-project.dto.ts`
- `models/project-response.model.ts`
- `project.controller.ts`

Register in `api/rest-api/rest-api.module.ts`.

## 6. MCP Tools (optional)

Create `src/api/mcp-api/tools/project.tools.ts`, register in `mcp-server.service.ts` and `mcp.module.ts`.

> Tools must call `auth.checkSystemPermission()` before business logic.

## 7. Tests

Create `src/features/project/commands/handlers/__tests__/` with handler specs.

## 8. Import Module

Add `ProjectModule` to `app.module.ts` imports.

## 9. Events + Cache (optional)

If the domain needs caching:

1. Create events in `src/features/<name>/events/impl/`
2. Create cache service in `src/infrastructure/cache/services/<name>-cache.service.ts`
3. Create cache constants in `src/infrastructure/cache/constants/<name>-cache.constants.ts`
4. Create cache event handlers in `src/infrastructure/cache/handlers/`
5. Register handlers in `src/infrastructure/cache/handlers/index.ts`
6. Register cache service in `CacheModule`
7. Publish events in command handlers via `EventBus`
8. Wrap queries in API service with cache service

See [Caching docs](caching.md) for the full pattern.
