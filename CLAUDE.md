# CLAUDE.md

## Template Setup (delete this section after scaffolding)

Follow **[docs/after-fork.md](docs/after-fork.md)** for the full checklist: rename, replace example domain, integrations (Docker Hub, SonarCloud), cleanup.

After completing all steps, delete `docs/after-fork.md` and this section.

## Project Architecture

See `docs/` for detailed documentation:
- [docs/architecture.md](docs/architecture.md) — layers, data flow
- [docs/cqrs.md](docs/cqrs.md) — commands, queries, events
- [docs/adding-new-domain.md](docs/adding-new-domain.md) — step-by-step for new features
- [docs/adding-mcp-tools.md](docs/adding-mcp-tools.md) — adding MCP tools
- [REVIEW.md](REVIEW.md) — code review checklist (architecture, SOLID, testing)

## Key Patterns

### CQRS (Command Query Responsibility Segregation)

- Commands: `src/features/{name}/commands/impl/` + `handlers/`
- Queries: `src/features/{name}/queries/impl/` + `handlers/`
- Events: `src/features/{name}/events/impl/` + `handlers/`
- API Service: `src/features/{name}/{name}-api.service.ts` (facade over CommandBus + QueryBus)
- Export handler arrays: `DOMAIN_COMMANDS`, `DOMAIN_QUERIES` in `handlers/index.ts`
- **Command return types**: only `{ id: string }`, `void`, or `{ success: boolean }` — never full entities
- **Queries**: can return any data shape
- Each domain has an **API service** (`*-api.service.ts`) — the ONLY public interface

### 3 API Layers (same domain, different transport)

- **GraphQL**: `src/api/graphql-api/{name}/` — resolvers + models + inputs (Yoga Federation v2)
- **REST**: `src/api/rest-api/{name}/` — controllers + DTOs + Swagger models
- **MCP**: `src/api/mcp-api/tools/{name}.tools.ts` — tool registrars with Zod schemas

All three layers call the same `*ApiService` facade. Business logic lives **only** in command/query handlers.

### Dictionary Service (Revisium integration)

- `src/features/dictionary/` — proxy + API service for Revisium data
- `revisium/migrations.json` — schema migrations (committed to git)
- `npm run revisium:standalone` — start local Revisium (port 8888, embedded PG on 5441)
- `npm run revisium:save-migrations` / `revisium:apply-migrations` — manage schema

### Cache + Events

- BentoCache (L1 memory + optional L2 Redis) via `CacheModule.forRoot()`
- Domain cache services: `src/infrastructure/cache/services/*-cache.service.ts`
- Event-driven invalidation: command → `eventBus.publish()` → cache handler → `invalidate*()`
- Stable cache keys: `makeCacheKeyFromArgs()` from `src/infrastructure/cache/utils/`

### Auth Guards

- GraphQL: `@UseGuards(GqlAuthGuard, GqlPermissionGuard)`
- REST: `@UseGuards(HttpAuthGuard, HttpPermissionGuard)`
- MCP: `auth.userId` from `McpAuthHelpers` inside tool handler
- Optional variants: `OptionalGqlAuthGuard`, `OptionalHttpAuthGuard`
- Permission decorator: `@PermissionParams({ action, subject })`
- **Cookies**: Login sets httpOnly `rev_at` + `rev_rt` cookies; `/api/auth/refresh` rotates both
- **Token versioning**: `user.tokenVersion` in JWT `ver` claim — increment to revoke all sessions

### OAuth (for MCP clients)

- PKCE authorization code flow with S256
- Tokens: `oat_` (access), `ort_` (refresh), `ocs_` (client secret)
- `.well-known/oauth-authorization-server` and `.well-known/oauth-protected-resource`

## Commands

```bash
npm run start:dev          # Start in watch mode
npm run build              # NestJS build + tsc-alias
npm run tsc                # Type check (strict)
npm run lint:ci            # ESLint with 0 warnings (includes sonarjs)
npm test                   # Jest with @swc/jest
npm run test:cov           # Coverage report
npm run prisma:migrate:dev # Create new migration
npm run prisma:generate    # Generate Prisma client
npm run docker:test-container-up   # Start test DB
npm run docker:test-container-down # Stop test DB
```

## Rules for AI Agents

### When adding a new feature:

1. Start with Prisma schema → `npm run prisma:migrate:dev`
2. Create domain module with CQRS (commands + queries + handlers)
3. Add API service facade
4. Add GraphQL resolver AND/OR REST controller
5. Add MCP tools if the feature should be accessible to AI agents
6. Write tests for handlers
7. Add permission enum values to `src/auth/types.ts` and seed permissions
8. Import new module in `app.module.ts`
9. If adding env vars — update both `.env.example` and `ENV.md`
10. Run: `npm run tsc && npm run lint:ci` before finishing

### When modifying existing code:

1. Read the relevant `docs/` file first
2. Follow existing patterns exactly — consistency matters
3. Run: `npm run tsc && npm run lint:ci` before finishing
4. Update `docs/` if you changed a pattern or added new concepts
5. Follow [REVIEW.md](REVIEW.md) checklist before finishing

### Documentation maintenance:

- `docs/` is the source of truth for HOW things work
- Update docs alongside code changes — they are living documents
- Each doc = reference + how-to, not abstract theory
- `ENV.md` — keep in sync with `.env.example`. When adding a new env var, update both files
- `sonar-project.properties` — keep organized by sections. When adding generated code or CQRS patterns, update exclusions/suppressions

### Code style:

- **No comments in code** — code must be self-documenting. No JSDoc, no inline comments, no section dividers. Only exception: rare cases where behavior is genuinely non-obvious and renaming/restructuring cannot express the intent
- **No `eslint-disable` directives** in source code. If a rule triggers, fix the code or adjust the ESLint config
- No magic numbers (except 0, 1, -1)
- No `console.log` — use `Logger` from `@nestjs/common`
- No `any` — use proper types
- Unused vars must be prefixed with `_`
- Max cognitive complexity: 15 (sonarjs rule)
- Prettier formatting enforced via ESLint
