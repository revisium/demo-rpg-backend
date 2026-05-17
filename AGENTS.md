# AGENTS.md — demo-rpg-backend

Operational notes for AI coding agents working in `demo-rpg-backend`.
`CLAUDE.md` is a compatibility symlink to this file.

## Repository Purpose

`demo-rpg-backend` is the NestJS subgraph for the Branching Tales demo. Apollo
Router federates this service with `revisium/demo-rpg-data` and
`revisium/demo-rpg-cms`; `revisium/supergraph-builder` composes the supergraph.

Broader product context, source-of-truth boundaries, ADRs, BRs, and schema
intent live in `demo-rpg-docs`. This repo owns backend runtime behaviour,
generated Revisium client artifacts, backend review gates, and backend docs.

## Start Here

- [README.md](README.md) — backend role, Revisium integration, local setup.
- [docs/dictionary-service.md](docs/dictionary-service.md) — migrations,
  OpenAPI, generated client, and runtime read path.
- [docs/getting-started.md](docs/getting-started.md) — local setup and first request.
- [docs/adding-mcp-tools.md](docs/adding-mcp-tools.md) — adding MCP tools.
- [ENV.md](ENV.md) — environment variable reference.
- [REVIEW.md](REVIEW.md) — backend review checklist.
- `../demo-rpg-docs/README.md#source-of-truth-boundaries` — cross-repo
  ownership boundaries.

## Source-Of-Truth Boundaries

| Area | Canonical owner |
|---|---|
| Product identity, ADRs, BRs, schema intent, capability coverage | `../demo-rpg-docs/` |
| Applied Revisium migrations/OpenAPI/generated backend client | `revisium/`, `src/__generated__/demo-rpg-data/` |
| Backend runtime architecture, CQRS, auth, MCP, tests | this repo |
| Cluster manifests, Argo CD, real secret names/values | `../../infrastructure` |

When behaviour crosses a boundary, update the canonical repo first and keep this
repo as a runtime implementation, not a duplicate product-spec source.

## Key Patterns

### CQRS

- Commands change state and return only `{ id }`, `void`, or `{ success }`.
- Queries return data and do not mutate state.
- Handlers own business logic.
- Each domain exposes a `*ApiService` facade as its public interface.
- API layers call API services, not Prisma or other API layers directly.

### API Layers

- GraphQL: `src/api/graphql-api/**`
- REST: `src/api/rest-api/**`
- MCP: `src/api/mcp-api/tools/**`

GraphQL resolvers, REST controllers, and MCP tools call the same domain API
service. Business logic belongs in command/query handlers.

### Dictionary Service

- Use `src/features/dictionary/` and generated SDK functions from
  `src/__generated__/demo-rpg-data/`.
- Do not hand-roll Revisium HTTP calls, URL building, or auth in runtime code.
- `revisium/migrations.json` is the backend runtime migration artifact.
- `revisium/openapi.json` drives `@hey-api/openapi-ts` codegen.
- After schema changes, regenerate and commit migrations, OpenAPI, and generated
  client together.

## Commands

```bash
npm run revisium:standalone   # local Revisium on 8888, embedded PG on 5441
npm run revisium:bootstrap    # apply migrations, create REST endpoint, codegen
npm run codegen:demo-rpg-data # regenerate typed REST client
npm run tsc                   # type check
npm run lint:ci               # ESLint with zero warnings
npm test                      # Jest
npm run build                 # Nest build
```

## Rules For Changes

1. Read the relevant `docs/` file and [REVIEW.md](REVIEW.md) first.
2. Follow existing CQRS and API-layer patterns.
3. Update docs when runtime behaviour, env vars, migrations, or review rules change.
4. Keep `.env.example` and [ENV.md](ENV.md) synchronized.
5. Do not add `eslint-disable` directives.
6. Do not add comments/JSDoc unless behaviour cannot be made clear by naming or
   structure.
7. Do not edit generated files by hand; regenerate from the owning command.
8. Stage only intended files and do not revert unrelated user changes.

## Verification Gate

Run before handoff, commit, push, or PR update:

```bash
npm run tsc
npm run lint:ci
npm test
```

If a required command cannot run, report the exact reason and remaining risk.
