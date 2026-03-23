# Dictionary Service

## Overview

The dictionary service integrates Revisium as a data source for static/reference data (product catalogs, configuration, dictionaries). Revisium provides Git-like version control for structured data with schema validation.

## Architecture

```
Your Backend                          Revisium Standalone
┌──────────────────┐                 ┌──────────────────┐
│ DictionaryModule │ ── REST API ──> │ npx revisium     │
│ ├── ProxyService │                 │ standalone       │
│ └── ApiService   │                 │ (port 8888)      │
└──────────────────┘                 └──────────────────┘
                                            │
                                     Embedded PostgreSQL
                                       (port 5441)
```

## Quick Start

```bash
# 1. Start Revisium standalone
npm run revisium:standalone

# 2. Open Revisium Admin UI
# http://localhost:8888 (login: admin / admin)

# 3. Create project and tables via Admin UI

# 4. Save schema migrations to git
npm run revisium:save-migrations

# 5. (Optional) Generate typed API client
npm run generate:dictionary-api
```

## Standalone Revisium

Runs via `npx revisium standalone` — embedded PostgreSQL, no Docker needed:

```bash
npm run revisium:standalone
# Starts on http://localhost:8888
# Embedded PG on port 5441
# Data stored in ./revisium/data/ (gitignored)
# Auth enabled: admin / admin
```

Configuration in `package.json`:
```json
"revisium:standalone": "npx revisium standalone --port 8888 --pg-port 5441 --data ./revisium/data --auth"
```

## Schema Migrations

Migrations are stored in `revisium/migrations.json` and committed to git:

```bash
# Export current schema from Revisium to file
npm run revisium:save-migrations

# Apply migrations from file to Revisium (idempotent)
npm run revisium:apply-migrations
```

In production, migrations are applied automatically on startup (`start:prod` script).

Migration format:
```json
[
  {
    "id": "2026-03-22T10:00:00.000Z",
    "hash": "abc123...",
    "changeType": "init",
    "tableId": "Product",
    "schema": { "type": "object", "properties": { ... } }
  }
]
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REVISIUM_URL` | — | Connection URL: `revisium://admin@localhost:8888/admin/dictionary/master/draft` |
| `REVISIUM_API_URL` | — | REST API base URL: `http://localhost:8888` |
| `REVISIUM_USERNAME` | `admin` | Login username |
| `REVISIUM_PASSWORD` | `admin` | Login password |

## Adding Dictionary Queries

1. Add methods to `DictionaryProxyService` for specific tables
2. Expose via `DictionaryApiService` facade
3. (Optional) Add caching in the API service layer
4. (Optional) Generate typed client from OpenAPI spec

## API Client Generation

For typed access to Revisium endpoint data:

```bash
# Install swagger-typescript-api
npm install -D swagger-typescript-api

# Generate client from Revisium endpoint OpenAPI spec
npx swagger-typescript-api generate \
  -p http://localhost:8888/endpoint/openapi/admin/dictionary/master/draft/openapi.json \
  -o src/features/dictionary/generated \
  --name api.ts
```

The generated client provides typed methods for all tables defined in Revisium.
