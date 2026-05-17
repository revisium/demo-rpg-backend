# demo-rpg-backend

NestJS subgraph for **Branching Tales** — an Apollo Router topology federating this service with two Revisium-managed subgraphs hosted on `cloud.revisium.io` (`revisium/demo-rpg-data`, `revisium/demo-rpg-cms`).

The project passport, ADRs, and shared spec live in [`revisium/demo-rpg-docs`](https://github.com/revisium/demo-rpg-docs); this repo is the running NestJS application that wraps and extends the Revisium-hosted game data.

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

## Architecture: how the backend integrates with Revisium

`demo-rpg-data` is a [Revisium](https://revisium.io) project on `cloud.revisium.io` that owns all read-only game content (regions, factions, items, NPCs, monsters, etc.). The backend never owns this data; it reads it through a typed REST client generated from the project's OpenAPI spec.

### Where things live

| Resource | Location |
|---|---|
| Game-data project (source of truth) | [cloud.revisium.io/revisium/demo-rpg-data](https://cloud.revisium.io/revisium/demo-rpg-data) |
| Committed schema (15 tables, 35 migrations) | [`revisium/migrations.json`](revisium/migrations.json) |
| Committed OpenAPI spec (per-project REST) | [`revisium/openapi.json`](revisium/openapi.json) |
| Generated typed client | [`src/__generated__/demo-rpg-data/`](src/__generated__/demo-rpg-data/) |
| Backend-side facade | [`src/features/dictionary/dictionary-api.service.ts`](src/features/dictionary/dictionary-api.service.ts) |
| Codegen config | [`openapi-ts.config.ts`](openapi-ts.config.ts) |
| Bootstrap orchestration | [`scripts/revisium-bootstrap.sh`](scripts/revisium-bootstrap.sh) |
| CLI workspace config (no secrets) | [`.revisium/revisium-cli.config.json`](.revisium/revisium-cli.config.json) |

### URL anatomy

Revisium exposes each project under stable URL patterns. The bits that matter for this repo:

```text
https://cloud.revisium.io
├── /revisium/demo-rpg-data                                     ← Admin UI
└── /endpoint
    ├── /openapi/revisium/demo-rpg-data/master/head/openapi.json  ← REST spec (codegen input)
    ├── /rest/revisium/demo-rpg-data/master/head/                 ← REST data API (runtime input)
    │     ├── /tables/regions/rows         POST   (list / filter)
    │     ├── /tables/regions/row/{rowId}  GET    (single row)
    │     └── … one route per table
    └── /graphql/revisium/demo-rpg-data/master/head/              ← GraphQL endpoint (used by supergraph)
```

The `master/head` segment pins the URL to the committed head revision of the `master` branch — Revisium serves a different stable URL for `draft` (uncommitted edits).

### Runtime read path

```text
   regions GraphQL query
      │
      ▼
src/api/graphql-api/regions/regions.resolver.ts
      │
      ▼
src/features/regions/queries/handlers/list-regions.handler.ts
      │
      ▼
src/features/dictionary/dictionary-api.service.ts            ← reads REVISIUM_DEMO_RPG_DATA_URL
      │
      ▼ (typed call, e.g. listRegions({ body: { first, after } }))
src/__generated__/demo-rpg-data/sdk.gen.ts                   ← generated from revisium/openapi.json
      │
      ▼ HTTPS GET / POST
https://cloud.revisium.io/endpoint/rest/revisium/demo-rpg-data/master/head/tables/regions/...
```

The base URL is injected once at module init in [`dictionary-api.service.ts`](src/features/dictionary/dictionary-api.service.ts) via `client.setConfig({ baseUrl: env.REVISIUM_DEMO_RPG_DATA_URL })`. The generated SDK targets that base for every call. No login at runtime — the `demo-rpg-data` project is read-public, so anonymous reads work.

### Schema-change path (write to Revisium)

```text
local: developer edits schema in Admin UI
                  │
                  ▼
   revisium migrate save  ──► writes revisium/migrations.json
                                  │
                                  ▼
                       npm run revisium:bootstrap
                                  │  (regenerates revisium/openapi.json
                                  │   + src/__generated__/demo-rpg-data/)
                                  ▼
                            git commit + push
                                  │
                                  ▼ CI build + cluster deploy
              migrations-Job inside K8s:
              REVISIUM_API_KEY=<from Secret>
              revisium migrate apply --commit --url revisium://cloud.revisium.io/revisium/demo-rpg-data/master:draft
                                  │
                                  ▼
              cloud.revisium.io/revisium/demo-rpg-data updates to new head
```

The `REVISIUM_API_KEY` is **only** needed to write to cloud (the migrations-Job pod). The runtime backend doesn't need it.

### Local dev vs production

| | Local | Production / K8s dev stand |
|---|---|---|
| Revisium server | `@revisium/standalone` on `localhost:8888`, no auth | `cloud.revisium.io`, API-key auth for writes |
| `REVISIUM_DEMO_RPG_DATA_URL` | `http://localhost:8888/endpoint/rest/admin/demo-rpg-data/master/head` | `https://cloud.revisium.io/endpoint/rest/revisium/demo-rpg-data/master/head` |
| Apply migrations | `npm run revisium:bootstrap` (no creds — `authMode: none`) | migrations-Job runs `revisium migrate apply` with `REVISIUM_API_KEY` from `app-secret` |
| Generate API key | not needed | manually on cloud.revisium.io → save into namespace `app-secret` as `RPG_REVISIUM_API_KEY` |
| Org name | `admin` (standalone default) | `revisium` |

See [`docs/dictionary-service.md`](docs/dictionary-service.md) for the full local-dev walkthrough and the "how to add a new migration" recipe.

## Features

- **CQRS** — Command/Query separation with `@nestjs/cqrs`
- **GraphQL** — Yoga Federation v2 (subgraph for Apollo Router), GraphiQL
- **REST API** — Swagger/OpenAPI documentation
- **MCP** — Model Context Protocol for AI agent integration
- **OAuth** — PKCE authorization code flow (for MCP clients)
- **Auth** — JWT + Passport + CASL ability-based permissions
- **Prisma** — PostgreSQL with type-safe ORM (for backend-owned tables; game data stays in Revisium)
- **Revisium integration** — typed REST client generated by `@hey-api/openapi-ts` from the project's committed OpenAPI spec
- **Caching** — BentoCache (L1 memory + L2 Redis with bus invalidation)
- **Logging** — Pino with trace ID propagation (CLS)
- **Metrics** — Prometheus with custom counters/histograms
- **Health** — Terminus health checks
- **Docker** — Multi-stage build, non-root user
- **CI/CD** — GitHub Actions (lint, tsc, test, SonarQube, Docker build)

## Quick Start (local)

```bash
# 1. Install dependencies
npm install

# 2. Start the backend's own Postgres + Redis (auth, sessions, BentoCache)
docker compose -f docker/docker-compose.yml up -d

# 3. Start the local @revisium/standalone (no auth, separate terminal)
npm run revisium:standalone

# 4. In a second terminal: apply migrations, create REST endpoint, save spec, regen client
npm run revisium:bootstrap

# 5. Configure backend env
cp .env.example .env
# Edit .env and set:
#   REVISIUM_DEMO_RPG_DATA_URL=http://localhost:8888/endpoint/rest/admin/demo-rpg-data/master/head

# 6. Backend's own DB
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed

# 7. Start the backend
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
| [Getting Started](docs/getting-started.md) | Prerequisites, local setup, first request |
| [Dictionary Service](docs/dictionary-service.md) | Revisium integration, bootstrap, adding migrations |
| [Adding MCP Tools](docs/adding-mcp-tools.md) | Registering MCP tools |
| [Deployment](docs/deployment.md) | Production deploy notes |
| [Environment Variables](ENV.md) | Complete env var reference |
| [Code Review](REVIEW.md) | Architecture, SOLID, testing, authorization checklist |

Broader project context (passport, ADRs, schemas) lives in [`revisium/demo-rpg-docs`](https://github.com/revisium/demo-rpg-docs).

## Tech Stack

| Category | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript 5.9 (strict) |
| GraphQL | Yoga Federation v2 + @nestjs/graphql |
| Database | PostgreSQL 17 + Prisma 7 |
| Auth | JWT + Passport + CASL |
| Revisium client | `@hey-api/openapi-ts` (generated from per-project OpenAPI) |
| Cache | BentoCache (L1 + L2 Redis) |
| Logging | Pino + nestjs-cls |
| Metrics | Prometheus (prom-client) |
| Testing | Jest + @swc/jest |
| Linting | ESLint + sonarjs + Prettier |
| CI | GitHub Actions |
| Container | Docker (multi-stage) |

## Related repos

- [`revisium/demo-rpg-docs`](https://github.com/revisium/demo-rpg-docs) — project passport, ADRs, schemas, formulas, bootstrap source
- [`revisium/supergraph-builder`](https://github.com/revisium/supergraph-builder) — composes this subgraph + the two Revisium subgraphs into the Apollo Router supergraph
- [`revisium/revisium-cli`](https://github.com/revisium/revisium-cli) — the CLI used by `revisium:bootstrap` and the K8s migrations-Job
- [`revisium/infrastructure`](https://github.com/revisium/infrastructure) — Helm charts + ArgoCD wiring for the dev stand

## License

MIT
