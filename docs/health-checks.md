# Health Checks

## Setup

Uses **@nestjs/terminus** for health check endpoints.

- Endpoint: `GET /health`
- Returns: `{ status: 'ok', info: { database: { status: 'up' } } }`

## Current Checks

- **Database**: Executes `SELECT 1` via Prisma

## Adding Health Checks

Edit `src/infrastructure/health/health.controller.ts`:

```typescript
@Get()
@HealthCheck()
async check() {
  return this.health.check([
    // Database check
    async () => {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { database: { status: 'up' } };
    },
    // Redis check (add when using Redis)
    // () => this.redis.pingCheck('redis'),
  ]);
}
```

## Kubernetes Probes

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

> For production, consider a lightweight `/livez` endpoint that returns 200 without DB checks. Use `/health` for readiness only.
