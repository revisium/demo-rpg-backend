# Getting Started

## Prerequisites

- Node.js 24.11.1 (see `.nvmrc`)
- Docker & Docker Compose
- npm 11+

## Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url>
cd <your-project>
npm install

# 2. Start PostgreSQL + Redis
docker compose -f docker/docker-compose.yml up -d

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Generate Prisma client
npm run prisma:generate

# 5. Create database schema
npm run prisma:migrate:dev

# 6. Seed database (roles, admin user)
npm run seed

# 7. Start development server
npm run start:dev

# 8. (Optional) Start Revisium standalone for dictionary service
npm run revisium:standalone
```

## Endpoints

| Endpoint | Description |
|---|---|
| `http://localhost:8080/graphql` | GraphQL Playground (Yoga GraphiQL) |
| `http://localhost:8080/api` | Swagger UI (REST API) |
| `http://localhost:8080/mcp` | MCP endpoint (POST only) |
| `http://localhost:8080/health` | Health check |
| `http://localhost:8080/metrics` | Prometheus metrics |

## First Request

### Login (REST)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Login (GraphQL)
```graphql
mutation {
  login(data: { email: "admin@example.com", password: "admin123" }) {
    accessToken
  }
}
```

## Development Mode (No Auth)

Set `NO_AUTH=true` in `.env` to bypass authentication during development. All requests will use the admin user automatically.
