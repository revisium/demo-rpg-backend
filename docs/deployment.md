# Deployment

Backend deployment notes for `demo-rpg-backend`. Real Kubernetes manifests,
Argo CD apps, image tags, ingress hosts, and secret names live in
`revisium/infrastructure`; this repo owns the application-level deploy contract.

## Runtime Responsibilities

On deploy, the backend stack must:

1. Apply Revisium schema migrations for `demo-rpg-data`.
2. Apply Prisma migrations for backend-owned PostgreSQL tables.
3. Seed backend-owned runtime data where required.
4. Start the NestJS app exposing health, metrics, REST, GraphQL, and MCP.

The Revisium runtime read path uses `REVISIUM_DEMO_RPG_DATA_URL`; the backend
does not need a Revisium API key for normal public reads.

## Required Inputs

| Input | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | backend runtime and Prisma migrations | Backend-owned PostgreSQL. |
| `JWT_SECRET` and auth/OAuth env vars | backend runtime | See [ENV.md](../ENV.md). |
| `REVISIUM_DEMO_RPG_DATA_URL` | backend runtime | REST base URL for generated SDK calls. |
| `REVISIUM_API_KEY` | migrations job only | Used by `revisium-cli` when applying cloud migrations. |

## Deployment Order

1. Build and publish the Docker image.
2. Run the migration job:
   - `npm run revisium:apply-migrations`
   - `npm run prisma:migrate:deploy`
   - `npm run seed:prod`
3. Start or roll the backend deployment.
4. Verify:
   - `/health`
   - `/metrics`
   - `/graphql`
   - `/api`
   - `/mcp`
5. Confirm Apollo Router/supergraph-builder can reach the backend subgraph SDL.

## Smoke Checks

```bash
curl -fsS "$BACKEND_URL/health"
curl -fsS "$BACKEND_URL/api"
```

For GraphQL and MCP checks, use the current dev/staging runbook in
`revisium/infrastructure` so the request targets the right router and auth
mode.

## Rollback

- Application rollback: redeploy the previous backend image through the
  infrastructure workflow.
- Prisma rollback: prefer corrective migrations unless a private runbook
  explicitly allows restoring from backup.
- Revisium data/schema rollback: use Revisium revision history or a corrective
  migration, then regenerate OpenAPI/client if the schema shape changed.
