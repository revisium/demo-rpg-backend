# demo-rpg-backend

NestJS subgraph for **Branching Tales** — an Apollo Router topology federating this service with two Revisium-managed subgraphs (`revisium/demo-rpg-data`, `revisium/demo-rpg-cms`).

Forked from [`revisium/template-nestjs-api`](https://github.com/revisium/template-nestjs-api). The README + spec live in [`revisium/demo-rpg-docs`](https://github.com/revisium/demo-rpg-docs); this repo is the running NestJS application that wraps and extends the Revisium-hosted game data.

## Role in the demo

```text
        ┌─────────────────────────┐
        │   Apollo Router         │
        │   (federated supergraph)│
        └──┬──────┬──────┬────────┘
           │      │      │
   ┌───────▼─┐  ┌─▼──┐  ┌▼─────────────┐
   │ this    │  │demo│  │ demo-rpg-cms │
   │ subgraph│  │-rpg│  │ (Revisium)   │
   │ (NestJS)│  │data│  └──────────────┘
   └─────────┘  └────┘
                       supergraph composed by
                       revisium/supergraph-builder
```

`demo-rpg-backend` adds business logic that doesn't fit a Revisium row (auth, computed cross-table fields, write paths, application-layer validation) and exposes it as a Yoga Federation v2 subgraph.

## Features

- **CQRS** — Command/Query separation with `@nestjs/cqrs`
- **GraphQL** — Yoga Federation v2 (subgraph for Apollo Router), GraphiQL
- **REST API** — Swagger/OpenAPI documentation
- **MCP** — Model Context Protocol for AI agent integration
- **OAuth** — PKCE authorization code flow (for MCP clients)
- **Auth** — JWT + Passport + CASL ability-based permissions
- **Prisma** — PostgreSQL with type-safe ORM (for backend-owned tables; game data stays in Revisium)
- **Revisium client** — connects to `cloud.revisium.io/revisium/demo-rpg-data` and `…/demo-rpg-cms`
- **Caching** — BentoCache (L1 memory + L2 Redis with bus invalidation)
- **Logging** — Pino with trace ID propagation (CLS)
- **Metrics** — Prometheus with custom counters/histograms
- **Health** — Terminus health checks
- **Docker** — Multi-stage build, non-root user
- **CI/CD** — GitHub Actions (lint, tsc, test, SonarQube, Docker build)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL + Redis (for backend-owned tables only)
docker compose -f docker/docker-compose.yml up -d

# 3. Configure environment (point REVISIUM_* at the demo cloud projects)
cp .env.example .env
# Edit .env and set:
#   REVISIUM_DEMO_RPG_DATA_URL=https://cloud.revisium.io/revisium/demo-rpg-data
#   REVISIUM_DEMO_RPG_CMS_URL=https://cloud.revisium.io/revisium/demo-rpg-cms

# 4. Generate Prisma client
npm run prisma:generate

# 5. Create database schema for backend-owned tables (auth, sessions)
npm run prisma:migrate:dev

# 6. Seed roles, permissions, admin user
npm run seed

# 7. Start development server
npm run start:dev
```

After startup:
- **GraphQL subgraph**: http://localhost:8080/graphql (GraphiQL)
- **REST API**: http://localhost:8080/api (Swagger UI)
- **MCP endpoint**: http://localhost:8080/mcp (POST)
- **Health**: http://localhost:8080/health
- **Metrics**: http://localhost:8080/metrics

Login: `admin@example.com` / `admin123` (or set `NO_AUTH=true` in `.env` for dev mode).

See [`docs/getting-started.md`](docs/getting-started.md) for detailed setup.

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
| [Caching](docs/caching.md) | BentoCache, invalidation, stable keys |
| [Logging & Tracing](docs/logging-and-tracing.md) | Pino, trace IDs, structured logs |
| [Metrics](docs/metrics.md) | Prometheus, custom metrics |
| [Health Checks](docs/health-checks.md) | Terminus, K8s probes |
| [Testing](docs/testing.md) | Jest, SWC, mocking, coverage |
| [Docker](docs/docker.md) | Dev compose, production build |
| [CI/CD](docs/ci-cd.md) | GitHub Actions workflows |
| [SonarQube](docs/sonarqube.md) | SonarCloud setup, quality gates |
| [Environment Variables](ENV.md) | Complete env var reference |
| [Adding a New Domain](docs/adding-new-domain.md) | Step-by-step guide |
| [Dictionary Service](docs/dictionary-service.md) | Revisium integration, migrations |
| [Adding MCP Tools](docs/adding-mcp-tools.md) | Tool creation guide |
| [Deployment](docs/deployment.md) | K8s manifests, production checklist |
| [Code Review](REVIEW.md) | Architecture, SOLID, testing, authorization checklist |

## Tech Stack

| Category | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.9 (strict) |
| GraphQL | Yoga Federation v2 + @nestjs/graphql |
| Database | PostgreSQL 17 + Prisma 7 |
| Auth | JWT + Passport + CASL |
| Cache | BentoCache (L1 + L2 Redis) |
| Logging | Pino + nestjs-cls |
| Metrics | Prometheus (prom-client) |
| Testing | Jest + @swc/jest |
| Linting | ESLint + sonarjs + Prettier |
| CI | GitHub Actions |
| Container | Docker (multi-stage) |

## Related repos

- [`revisium/demo-rpg-docs`](https://github.com/revisium/demo-rpg-docs) — project passport, ADRs, schemas, formulas, bootstrap source
- [`revisium/template-nestjs-api`](https://github.com/revisium/template-nestjs-api) — upstream template; sync periodically
- [`revisium/supergraph-builder`](https://github.com/revisium/supergraph-builder) — composes this subgraph + the two Revisium subgraphs into the Apollo Router supergraph

## License

MIT
