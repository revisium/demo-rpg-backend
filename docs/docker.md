# Docker

## Development

```bash
# Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# Stop
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes
docker compose -f docker/docker-compose.yml down --volumes
```

## Production Build

Multi-stage Dockerfile at `docker/Dockerfile`:

```bash
# Build image
docker build -f docker/Dockerfile -t my-app:latest .

# Run
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  my-app:latest
```

### Build Stages

1. **Builder**: `node:24.11.1-alpine` — installs deps, runs `npm run build`
2. **Runtime**: `node:24.11.1-alpine` — copies dist + node_modules, runs as non-root `appuser`

## Docker Compose Services

### Development (`docker-compose.yml`)
- **db**: PostgreSQL 17 (port 5433)
- **redis**: Redis 7 (port 6380)

### Test (`docker-compose-test.yml`)
- **db**: PostgreSQL 17 (port 5434, separate database)
