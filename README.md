# template-nestjs-api

Production-ready NestJS backend template with CQRS, three API layers, and enterprise infrastructure.

## Features

- **CQRS** — Command/Query separation with `@nestjs/cqrs`
- **GraphQL** — Yoga Federation v2, code-first, GraphiQL
- **REST API** — Swagger/OpenAPI documentation
- **MCP** — Model Context Protocol for AI agent integration
- **OAuth** — PKCE authorization code flow (for MCP clients)
- **Auth** — JWT + Passport + CASL ability-based permissions
- **Prisma** — PostgreSQL with type-safe ORM
- **Caching** — In-memory with TTL (upgradeable to BentoCache L1+L2)
- **Logging** — Pino with trace ID propagation (CLS)
- **Metrics** — Prometheus with custom counters/histograms
- **Health** — Terminus health checks
- **Docker** — Multi-stage build, non-root user
- **CI/CD** — GitHub Actions (lint, tsc, test, SonarQube, Docker build)
- **ESLint** — Strict config with sonarjs plugin
- **TypeScript** — Strict mode with `noUncheckedIndexedAccess`

## After Fork

See **[docs/after-fork.md](docs/after-fork.md)** — step-by-step guide: rename project, replace example domain, set up Docker Hub, SonarCloud, and other integrations. Delete the file when done.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# 3. Configure environment
cp .env.example .env

# 4. Generate Prisma client
npm run prisma:generate

# 5. Create database schema
npm run prisma:migrate:dev

# 6. Seed roles, permissions, admin user
npm run seed

# 7. Start development server
npm run start:dev
```

After startup:
- **GraphQL**: http://localhost:8080/graphql (GraphiQL)
- **REST API**: http://localhost:8080/api (Swagger UI)
- **Health**: http://localhost:8080/health

Login: `admin@example.com` / `admin123` (or set `NO_AUTH=true` in `.env` for dev mode)

See [docs/getting-started.md](docs/getting-started.md) for detailed setup and first requests.

## Documentation

| Doc | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Prerequisites, setup, first request |
| [Architecture](docs/architecture.md) | Layers, data flow, module organization |
| [CQRS](docs/cqrs.md) | Commands, queries, events, API service facade |
| [GraphQL](docs/graphql.md) | Yoga Federation setup, resolvers, models, inputs |
| [REST API](docs/rest-api.md) | Swagger, controllers, DTOs, validation |
| [MCP](docs/mcp.md) | MCP tools, Zod schemas, auth flow |
| [OAuth](docs/oauth.md) | PKCE flow, token types, security |
| [Auth & Permissions](docs/auth-and-permissions.md) | JWT, CASL, guards, roles |
| [JWT Lifecycle](docs/jwt-lifecycle.md) | Token rotation, cookies, refresh, revocation |
| [Prisma](docs/prisma.md) | Schema, migrations, seed, transactions |
| [Caching](docs/caching.md) | In-memory cache, BentoCache upgrade path |
| [Logging & Tracing](docs/logging-and-tracing.md) | Pino, trace IDs, structured logs |
| [Metrics](docs/metrics.md) | Prometheus, custom metrics |
| [Health Checks](docs/health-checks.md) | Terminus, K8s probes |
| [Testing](docs/testing.md) | Jest, SWC, mocking, coverage |
| [Docker](docs/docker.md) | Dev compose, production build |
| [CI/CD](docs/ci-cd.md) | GitHub Actions workflows |
| [SonarQube](docs/sonarqube.md) | SonarCloud setup, quality gates |
| [Environment Variables](ENV.md) | Complete env var reference (root file) |
| [Adding a New Domain](docs/adding-new-domain.md) | Step-by-step guide |
| [Dictionary Service](docs/dictionary-service.md) | Revisium integration, migrations, standalone |
| [Adding MCP Tools](docs/adding-mcp-tools.md) | Tool creation guide |
| [Deployment](docs/deployment.md) | K8s manifests, production checklist |
| [Code Review](REVIEW.md) | Architecture, SOLID, testing, authorization checklist |

## Endpoints

| URL | Description |
|---|---|
| `/graphql` | GraphiQL |
| `/api` | Swagger UI (REST API) |
| `/mcp` | MCP endpoint (POST) |
| `/health` | Health check |
| `/metrics` | Prometheus metrics |

## Tech Stack

| Category | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.9 (strict) |
| GraphQL | Yoga Federation v2 + @nestjs/graphql |
| Database | PostgreSQL 17 + Prisma 7 |
| Auth | JWT + Passport + CASL |
| Cache | In-memory (BentoCache-ready) |
| Logging | Pino + nestjs-cls |
| Metrics | Prometheus (prom-client) |
| Testing | Jest + @swc/jest |
| Linting | ESLint + sonarjs + Prettier |
| CI | GitHub Actions |
| Container | Docker (multi-stage) |

## License

MIT
