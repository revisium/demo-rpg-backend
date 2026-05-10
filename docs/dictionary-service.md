# Dictionary Service

`demo-rpg-backend` reads its game data (regions, factions, items, NPCs, monsters, dialogs, …) from a Revisium project named `demo-rpg-data`. It does **not** reach into a live cloud project at runtime — instead, the schema lives in `revisium/migrations.json` (committed to git), gets applied to a Revisium instance (local standalone for dev, dedicated cluster pod for K8s), and the typed REST client is generated from that instance's per-project OpenAPI spec.

## Architecture

```
                                                     committed to git
                                                          │
                                            ┌─────────────┴───────────────┐
                                            │  revisium/migrations.json   │  schema (15 tables, 31 ops)
                                            │  revisium/openapi.json      │  generated REST spec
                                            │  src/__generated__/         │  typed @hey-api client
                                            └─────────────┬───────────────┘
                                                          │
                                                applied + codegen
                                                          │
   ┌────────────────────────────┐                ┌────────▼────────────────┐
   │ DictionaryApiService       │                │  Revisium server        │
   │ (NestJS, calls listRegions │  REST/JSON ──▶ │  • local: standalone    │
   │  / getRegions / …)         │                │  • cluster: own pod     │
   └────────────────────────────┘                └─────────────────────────┘
```

There is **no `@revisium/client`, no hand-rolled fetch, no auth login** in the runtime backend. The generated SDK (`src/__generated__/demo-rpg-data/`) talks REST directly to the project endpoint configured by `REVISIUM_DEMO_RPG_DATA_URL`.

## Local development

### Fresh-clone bootstrap

```bash
# 1. install
npm install

# 2. start the standalone Revisium server (long-running — keep in its own terminal)
npm run revisium:standalone
# → http://localhost:8888  (admin UI + REST + GraphQL endpoints)
# → embedded PostgreSQL on port 5441
# → data persisted in ./revisium/data/  (gitignored)
# → admin user created on first run, ADMIN_PASSWORD env or `admin`

# 3. in a second terminal, apply migrations + create REST endpoint + save spec + regenerate the client
npm run revisium:bootstrap
# This is idempotent — safe to re-run.

# 4. set REVISIUM_DEMO_RPG_DATA_URL in your .env (see below), then:
npm run start:dev
```

After bootstrap:

- **Local Admin UI**: `http://localhost:8888` (login `admin / admin` — change via `ADMIN_PASSWORD`)
- **OpenAPI spec**: `http://localhost:8888/endpoint/openapi/admin/demo-rpg-data/master/head/openapi.json`
- **REST root for the backend**: `http://localhost:8888/endpoint/rest/admin/demo-rpg-data/master/head`

In `.env` (or `.env.local`):

```bash
REVISIUM_DEMO_RPG_DATA_URL=http://localhost:8888/endpoint/rest/admin/demo-rpg-data/master/head
```

### Adding a new migration

1. Make sure the standalone is running and the project is bootstrapped (`npm run revisium:bootstrap` once).
2. Open the admin UI at `http://localhost:8888`, navigate to `admin/demo-rpg-data/master`, edit the schema (add table, add field, change enum, etc.).
3. Export the change to git:
   ```bash
   npm run revisium:save-migrations   # rewrites revisium/migrations.json
   npm run revisium:bootstrap         # re-fetches openapi.json + regenerates the client
   ```
4. Update the backend code that consumes the new shape (handlers, resolvers, controllers, MCP tools, tests).
5. Commit `revisium/migrations.json`, `revisium/openapi.json`, and `src/__generated__/demo-rpg-data/` together with your code change. Reviewers see the schema diff inline with the code diff.

### Resetting the local standalone

```bash
# stop the running standalone (Ctrl-C in its terminal)
rm -rf revisium/data
npm run revisium:standalone     # fresh DB, fresh admin
npm run revisium:bootstrap      # re-apply everything
```

### Manual `revisium` CLI

`revisium-bootstrap.ts` orchestrates everything, but the underlying CLI is also exposed:

```bash
# save current schema to migrations.json
npm run revisium:save-migrations

# apply migrations.json (interactive token prompt unless you pass ?token=… in the URL)
npm run revisium:apply-migrations
```

The `--url` argument format is documented at <https://github.com/revisium/revisium-cli/blob/master/docs/url-format.md>.

## Production / K8s

In the demo cluster, `demo-rpg-data` runs in its own dedicated `revisium/revisium` pod under the `demo-dev` namespace. The `migrations-job` Helm hook applies `revisium/migrations.json` on every deploy:

```bash
# inside the migrations-job pod
npm run revisium:apply-migrations
npm run prisma:migrate:deploy
npm run seed:prod
```

The cluster Revisium pod's REST URL — `http://dev-demo-revisium-application.demo-dev.svc.cluster.local:80/endpoint/rest/admin/demo-rpg-data/master/head` — is what gets injected into the backend pod as `REVISIUM_DEMO_RPG_DATA_URL` via Helm values.

The migrations-job uses `REVISIUM_URL` (a `revisium://…?token=…` connection URL) to talk to the cluster Revisium, not the same `REVISIUM_DEMO_RPG_DATA_URL` the runtime uses.

See `revisium/infrastructure → development/demo/{revisium,backend}/values.yaml` for the chart wiring.

## Env vars

| Variable | Used by | Description |
|---|---|---|
| `REVISIUM_DEMO_RPG_DATA_URL` | runtime backend | REST base URL the generated client targets. Empty disables the dictionary; `regions` queries return empty connections. |
| `REVISIUM_URL` | migrations-job (K8s) | `revisium://…?token=…` connection URL the `revisium-cli` uses to apply migrations. Not consumed at runtime. |
| `REVISIUM_USERNAME`, `REVISIUM_PASSWORD` | bootstrap script only | Used by `scripts/revisium-bootstrap.ts` to log into the local standalone. Not consumed at runtime. |
| `REVISIUM_STANDALONE_URL` | bootstrap script only | Where the bootstrap script reaches the local standalone. Default `http://localhost:8888`. |

See [`ENV.md`](../ENV.md) for the full reference.

## Adding a new domain that reads from the dictionary

1. Make sure the table exists in `demo-rpg-data` and is reflected in `revisium/migrations.json`.
2. Run `npm run revisium:bootstrap` so the new table is in the generated SDK (`listFoo`, `getFoo`, etc.).
3. Add a thin method to `DictionaryApiService`:
   ```typescript
   async listFoo(opts: { first?: number; after?: string }) {
     if (!this.enabled) return null;
     const { data, error } = await listFoo({ body: { first: opts.first ?? 100, after: opts.after } });
     if (error) { /* log + return null */ }
     return data ?? null;
   }
   ```
4. Use the typed result (`data: DemoRpgDataFoo` etc.) in your CQRS handler — no runtime guards needed; the OpenAPI types are derived from the live schema.

See [`adding-mcp-tools.md`](./adding-mcp-tools.md) for exposing the new domain to MCP clients.
