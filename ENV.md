# Environment Variables

> **Keep this file in sync with `.env.example`.** When adding a new env var, update both files.

## Required

| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5433/db` | PostgreSQL connection string |
| `JWT_SECRET` | `change-me-in-production` | Secret for JWT signing (min 32 chars in production) |
| `ADMIN_PASSWORD` | `admin123` | Password for seeded admin user |

## Server

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP server port |
| `PUBLIC_URL` | `http://localhost:8080` | Public URL for OAuth `.well-known` metadata |
| `NODE_ENV` | — | Set to `production` for JSON logs and optimized build |

## Authentication

| Variable | Default | Description |
|---|---|---|
| `NO_AUTH` | `false` | Set to `true` to bypass JWT auth in development |
| `JWT_REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh token absolute expiry (days) |
| `JWT_REFRESH_GRACE_PERIOD_MS` | `30000` | Grace period for multi-tab race conditions (0 = disabled) |
| `COOKIE_SECURE` | auto | Cookie Secure flag (`true`/`false`, auto = based on NODE_ENV) |

## Cache

| Variable | Default | Description |
|---|---|---|
| `CACHE_ENABLED` | `false` | Enable in-memory caching |
| `CACHE_L1_MAX_SIZE` | `128mb` | Max memory for L1 cache (when using BentoCache) |
| `CACHE_L2_REDIS_URL` | — | Redis URL for L2 cache (when using BentoCache) |
| `CACHE_BUS_HOST` | — | Redis host for cache bus (when using BentoCache) |
| `CACHE_BUS_PORT` | — | Redis port for cache bus (when using BentoCache) |

## Transactions

| Variable | Default | Description |
|---|---|---|
| `TRANSACTION_MAX_WAIT` | `10000` | Max time to acquire connection (ms) |
| `TRANSACTION_TIMEOUT` | `15000` | Transaction timeout (ms) |
| `TRANSACTION_MAX_RETRIES` | `20` | Max retry attempts for serialization failures |
| `TRANSACTION_BASE_DELAY_MS` | `30` | Base delay for exponential backoff (ms) |
| `TRANSACTION_MAX_DELAY_MS` | `1500` | Max delay cap for backoff (ms) |

## OAuth / MCP

| Variable | Default | Description |
|---|---|---|
| `MCP_ACCESS_TOKEN_EXPIRY_DAYS` | `30` | OAuth access token expiry for MCP scope (days) |

## Observability

| Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | `info` | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics at `/metrics` |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | `10000` | Delay before shutdown completes (ms) |

## Revisium (Dictionary Service)

| Variable | Default | Description |
|---|---|---|
| `REVISIUM_DEMO_RPG_DATA_URL` | — | REST endpoint base URL for the demo-rpg-data project. Local: `http://localhost:8888/endpoint/rest/admin/demo-rpg-data/master/head`. Cluster: `http://dev-demo-revisium-application.demo-dev.svc.cluster.local:80/endpoint/rest/admin/demo-rpg-data/master/head`. Empty → dictionary calls return null and `regions` queries serve empty results. |

The dictionary uses an `@hey-api/openapi-ts`-generated REST client against this base URL — no SDK login or revision pinning needed. Schema migrations live in `revisium/migrations.json`; the OpenAPI spec used for codegen lives in `revisium/openapi.json`.

### Bootstrap-only env (only used by `npm run revisium:bootstrap`)

| Variable | Default | Description |
|---|---|---|
| `REVISIUM_STANDALONE_URL` | `http://localhost:8888` | Where the local `@revisium/standalone` is running |
| `REVISIUM_USERNAME` | `admin` | Username for the bootstrap script's login |
| `REVISIUM_PASSWORD` | `admin` | Password for the bootstrap script's login |

## Deprecated

_None yet. Mark deprecated variables here before removing them._
