# Code Review Checklist

## Architecture

### CQRS Compliance
- [ ] Commands change state only — return `{ id }`, `void`, or `{ success: boolean }`, never data
- [ ] Queries read data only — no side effects
- [ ] Business logic lives in handlers, not in resolvers/controllers/MCP tools
- [ ] API service (`*-api.service.ts`) is the only public interface of a domain module
- [ ] Handlers don't call other handlers — use EventBus for cross-domain communication

### Layer Separation
- [ ] GraphQL resolvers call only API services, never Prisma directly
- [ ] REST controllers call only API services, never Prisma directly
- [ ] MCP tools call only API services, never Prisma directly
- [ ] API layers don't call each other (no resolver calling a controller)
- [ ] No imports from one domain into another — use events or shared module

### Abstraction Levels
- [ ] Methods don't mix high-level and low-level operations
- [ ] Low-level string/array/object operations extracted to utility methods
- [ ] Prefer functional style (`map`, `filter`) over mutable loops
- [ ] Use type guards (`isXxx()`) instead of inline type assertions
- [ ] Complex conditionals extracted to descriptively-named methods

## SOLID

- [ ] **Single Responsibility** — each class/handler does one thing
- [ ] **Open/Closed** — new behavior via new handlers, not modifying existing ones
- [ ] **Liskov Substitution** — interface implementations are interchangeable
- [ ] **Interface Segregation** — small, focused interfaces (not god-interfaces)
- [ ] **Dependency Inversion** — depend on abstractions (DI), not concrete classes

## Code Quality

### Naming
- [ ] Classes, types, enums — `PascalCase`
- [ ] Variables, functions, methods — `camelCase`
- [ ] Constants — `UPPER_SNAKE_CASE`
- [ ] Files — `kebab-case.ts`
- [ ] Commands — `CreateTaskCommand`, handlers — `CreateTaskHandler`
- [ ] API services — `TaskApiService`, not `TaskService`

### Readability
- [ ] **No comments** — no JSDoc, no inline comments, no section dividers. Code is self-documenting
- [ ] **No `eslint-disable`** directives in source code — fix the code or adjust ESLint config
- [ ] No magic numbers — extract to named constants
- [ ] No `console.log` — use `Logger` from `@nestjs/common`
- [ ] No `any` type — use proper types
- [ ] Unused variables prefixed with `_`
- [ ] Short methods — if a method needs a comment, it should be extracted

### Error Handling
- [ ] Use NestJS exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- [ ] Don't catch exceptions just to rethrow — let them propagate
- [ ] Validate at system boundaries (API inputs), trust internal code

## Authorization

- [ ] All GraphQL resolvers have `@UseGuards(GqlAuthGuard)` + `@UseGuards(GqlPermissionGuard)` with `@PermissionParams`
- [ ] All REST controllers have `@UseGuards(HttpAuthGuard)` + `@UseGuards(HttpPermissionGuard)` with `@PermissionParams`
- [ ] All MCP tools call `auth.checkSystemPermission()` before business logic
- [ ] `@PermissionParams` at class level for default, method level for overrides
- [ ] New subjects added to `PermissionSubject` enum and seeded

## JWT & Cookies

- [ ] Login sets `rev_at` and `rev_rt` httpOnly cookies
- [ ] Login response contains `expiresIn` and `tokenType: "cookie"` (no token in body)
- [ ] Refresh rotates both tokens (new cookies, old refresh revoked)
- [ ] Logout clears cookies and revokes token family
- [ ] Bearer header still works alongside cookies
- [ ] `tokenVersion` included in JWT `ver` claim
- [ ] Expired JWT returns 401
- [ ] Revoked refresh token triggers family revocation (after grace period)

## Database

- [ ] New models have `@id @default(nanoid())`, `createdAt`, `updatedAt`
- [ ] Indexes on foreign keys and frequently queried fields
- [ ] Migration created and tested (`npm run prisma:migrate:dev`)
- [ ] Seed updated for new roles/permissions if needed

## Testing

- [ ] Handler tests use real database, not Prisma mocks
- [ ] Test data created with `nanoid()` for parallel safety
- [ ] Each test prepares its own data — no shared mutable state
- [ ] E2E tests cover: success path, validation errors, 404, auth (401/403)
- [ ] Tests follow Arrange → Act → Assert structure
- [ ] No non-null assertions (`!`) — use `expect(value).not.toBeNull()` first

## GraphQL Specifics

- [ ] Models match domain types — no transformation in resolvers
- [ ] Nullable fields marked with `{ nullable: true }`
- [ ] Resolver fetches data after mutation (command returns id, resolver queries full object)
- [ ] Inputs use `@InputType()` with descriptive field names

## REST Specifics

- [ ] DTOs use `class-validator` decorators for validation
- [ ] `@ApiProperty()` on all DTO fields for Swagger docs
- [ ] `@ApiOperation({ summary })` on all endpoints
- [ ] `@ApiCommonErrors()` for standard error responses
- [ ] Query params use `@Transform()` for type coercion

## MCP Specifics

- [ ] Tools use Zod schemas for input validation
- [ ] `readOnlyHint: true` annotation on read-only tools
- [ ] Response format: `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`
- [ ] Permission check before business logic

## Final Checks

- [ ] `npm run tsc` — no type errors
- [ ] `npm run lint:ci` — no warnings
- [ ] `npm test` — all tests pass
- [ ] `ENV.md` updated if new env vars added
- [ ] `sonar-project.properties` updated if new exclusions needed
- [ ] `docs/` updated if patterns changed
