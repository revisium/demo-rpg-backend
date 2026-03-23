# Testing

## Philosophy

Tests use a **real database**, not mocks. Each test creates its own data with unique IDs (`nanoid`), making tests parallel-safe — no conflicts, no ordering dependencies.

## Commands

```bash
# Run tests (requires test DB running)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Start test database
npm run docker:test-container-up

# Stop test database
npm run docker:test-container-down
```

## Test Data Preparation

Every test creates fresh data with `nanoid` for uniqueness:

```typescript
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/database/prisma.service';

export async function prepareTask(prisma: PrismaService) {
  const id = nanoid();
  const user = await prisma.user.create({
    data: {
      email: `test-${id}@example.com`,
      username: `user-${id}`,
      password: 'hashed',
      roleId: 'admin',
    },
  });

  const task = await prisma.task.create({
    data: {
      title: `Test Task ${id}`,
      userId: user.id,
    },
  });

  return { userId: user.id, taskId: task.id, taskTitle: task.title };
}
```

This pattern ensures:
- **Parallel safety** — unique IDs prevent conflicts between test workers
- **No cleanup needed** — each test uses its own data, old data doesn't interfere
- **Deterministic** — same setup code, different data each run
- **Fast** — no transaction rollback overhead

## Handler Unit Tests (with real DB)

Use `createHandlerModule` — a minimal testing module that only includes `DatabaseModule` and the handler under test. Always call `app.close()` in `afterAll`.

```typescript
describe('CreateTaskHandler', () => {
  let app: INestApplication;
  let handler: CreateTaskHandler;
  let prisma: PrismaService;

  beforeAll(async () => {
    const result = await createHandlerModule([CreateTaskHandler]);
    app = result.app;
    handler = result.module.get(CreateTaskHandler);
    prisma = result.prisma;
  });

  afterAll(async () => {
    await app.close();  // Releases DB connections
  });

  it('should create a task and return its id', async () => {
    const id = nanoid();
    const user = await prisma.user.create({ ... });

    const result = await handler.execute(
      new CreateTaskCommand({ title: `Test ${id}`, userId: user.id }),
    );

    expect(result.id).toBeDefined();

    const task = await prisma.task.findUnique({ where: { id: result.id } });
    expect(task).not.toBeNull();
    expect(task!.title).toBe(`Test ${id}`);
  });
});
```

### Key rules:
- **`beforeAll`** — create module once per test file (not `beforeEach`)
- **`afterAll`** — always call `app.close()` to release DB connections
- **Minimal providers** — only the handler being tested + its direct dependencies
- **Real DB** — no Prisma mocks; verify actual persistence

## E2E Tests

### App Caching

`getTestApp()` creates one NestJS app instance **per test file** and caches it. Jest runs each file in a separate VM, so there's no cross-file contamination. This saves 2-5 seconds per test file.

```typescript
beforeAll(async () => {
  app = await getTestApp();    // Created once, reused within file
});

afterAll(async () => {
  await closeTestApp();        // Releases DB connections
});
```

### Authorization (Primary Focus)

E2E tests **must** verify authorization boundaries. This is the primary purpose of E2E testing — business logic is covered by handler unit tests.

### REST API — Authorization Tests

```typescript
describe('Authorization', () => {
  it('should return 401 for unauthenticated request', async () => {
    await anonGet(app, '/api/tasks').expect(401);
  });

  it('should return 401 for invalid token', async () => {
    await authGet(app, '/api/tasks', 'invalid-token').expect(401);
  });

  it('should return 401 for unauthenticated POST', async () => {
    await anonPost(app, '/api/tasks', { title: 'Unauthorized' }).expect(401);
  });
});
```

### GraphQL — Authorization Tests

```typescript
describe('Authorization', () => {
  it('should return error for unauthenticated query', async () => {
    const result = await gqlRawQuery({
      app,
      query: `query { tasks { items { id } totalCount } }`,
    });

    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('should return error for invalid token', async () => {
    const result = await gqlRawQuery({
      app,
      token: 'invalid-token',
      query: `query { tasks { items { id } totalCount } }`,
    });

    expect(result.errors).toBeDefined();
  });
});
```

### E2E Test Coverage Requirements

For every endpoint, verify:
- **401 Unauthorized** — no token / invalid token
- **403 Forbidden** — valid token but insufficient permissions
- **200/201** — valid token with correct permissions
- **400** — validation errors (bad input)
- **404** — resource not found

## E2E Tests — CRUD

```typescript
describe('REST API (E2E)', () => {
  let app: INestApplication;
  let fixture: PreparedTask;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    const prisma = app.get(PrismaService);
    fixture = await prepareTask(prisma);
    adminToken = generateTestToken(app, {
      userId: fixture.userId,
      email: fixture.userEmail,
      username: 'test',
      roleId: 'admin',
    });
  });

  it('GET /api/tasks/:id', async () => {
    const res = await authGet(app, `/api/tasks/${fixture.taskId}`, adminToken).expect(200);
    expect(res.body.id).toBe(fixture.taskId);
  });

  it('POST /api/tasks', async () => {
    const res = await authPost(app, '/api/tasks', adminToken, {
      title: 'New Task',
    }).expect(201);
    expect(res.body.id).toBeDefined();
  });
});
```

## Cookie-Based Auth Tests

Test JWT lifecycle with httpOnly cookies using supertest:

```typescript
function extractCookies(res: request.Response): Record<string, string> {
  const raw = res.headers['set-cookie'] as unknown as string[];
  const result: Record<string, string> = {};
  for (const cookie of raw) {
    const [nameValue] = cookie.split(';');
    const eqIndex = nameValue!.indexOf('=');
    if (eqIndex > 0) {
      result[nameValue!.substring(0, eqIndex)] = nameValue!.substring(eqIndex + 1);
    }
  }
  return result;
}

it('full login → me → refresh → logout lifecycle', async () => {
  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: fixture.userEmail, password: fixture.userPassword });

  const cookies = extractCookies(loginRes);
  expect(cookies['rev_at']).toBeDefined();
  expect(cookies['rev_rt']).toBeDefined();

  const meRes = await request(app.getHttpServer())
    .get('/api/auth/me')
    .set('Cookie', `rev_at=${cookies['rev_at']}`);
  expect(meRes.body.id).toBeDefined();

  const refreshRes = await request(app.getHttpServer())
    .post('/api/auth/refresh')
    .set('Cookie', `rev_rt=${cookies['rev_rt']}`);
  const newCookies = extractCookies(refreshRes);
  expect(newCookies['rev_rt']).not.toBe(cookies['rev_rt']);

  const logoutRes = await request(app.getHttpServer())
    .post('/api/auth/logout')
    .set('Cookie', `rev_rt=${newCookies['rev_rt']}`);
  expect(logoutRes.status).toBe(204);
});
```

Key test scenarios:
- Login → cookies set
- Me with cookie → 200
- Refresh → rotation (new cookies)
- Refresh without cookie → 401
- Refresh with reused token → reuse detection
- Logout → cookies cleared
- Bearer header still works
- Expired JWT → 401

## Test Utilities

| File | Purpose |
|---|---|
| `src/__tests__/utils/test-app.ts` | Cached NestJS app for E2E tests |
| `src/__tests__/utils/create-handler-module.ts` | Minimal module for handler tests |
| `src/__tests__/utils/prepare-task.ts` | Task fixture factory (nanoid) |
| `src/__tests__/utils/auth-helpers.ts` | JWT token generation |
| `src/__tests__/utils/http-helpers.ts` | `anonGet`, `anonPost`, `authGet`, `authPost`, `authPatch`, `authDelete` |
| `src/__tests__/utils/graphql-helpers.ts` | `gqlQuery` (throws on errors), `gqlRawQuery` (returns errors) |

## Coverage

Reports in `coverage/`. Exclusions: `main.ts`, `__generated__/`, `*.module.ts`, `__tests__/`.
