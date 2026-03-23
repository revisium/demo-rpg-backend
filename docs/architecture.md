# Architecture

## Layers

```
┌─────────────────────────────────────────────────┐
│                   API Layers                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ GraphQL  │  │   REST   │  │   MCP    │       │
│  │ (Yoga)   │  │ (Swagger)│  │ (Tools)  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │           │
│  ┌────▼──────────────▼──────────────▼────┐      │
│  │         API Service (Facade)          │      │
│  │      CommandBus + QueryBus            │      │
│  └────┬──────────────────────────────┬───┘      │
│       │                              │          │
│  ┌────▼─────┐              ┌────────▼────┐      │
│  │ Commands │              │   Queries   │      │
│  │ Handlers │              │   Handlers  │      │
│  └────┬─────┘              └────────┬────┘      │
│       │                              │          │
│  ┌────▼──────────────────────────────▼───┐      │
│  │           Prisma (Database)           │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

## Data Flow

1. **Request** → API layer (resolver/controller/MCP tool)
2. **API layer** → calls `*ApiService` facade
3. **ApiService** → dispatches Command or Query via CQRS bus
4. **Handler** → executes business logic using Prisma
5. **Response** ← returned through the same chain

## Key Principle: One Domain, Three APIs

Each domain (e.g., Task) exposes the same business logic through:
- **GraphQL**: `src/api/graphql-api/task/` — resolvers, models, inputs
- **REST**: `src/api/rest-api/task/` — controllers, DTOs, Swagger models
- **MCP**: `src/api/mcp-api/tools/task.tools.ts` — MCP tool registrar

All three call the same `TaskApiService` facade. Business logic lives only in command/query handlers.

## Module Organization

```
src/
├── api/               # API layers (GraphQL, REST, MCP)
│   ├── graphql-api/   # Yoga Federation resolvers
│   ├── rest-api/      # Swagger controllers
│   └── mcp-api/       # MCP tools
├── features/          # Business logic (CQRS domains)
│   ├── auth/          # JWT + CASL + guards
│   ├── oauth/         # OAuth server (for MCP)
│   └── task/          # Example domain
├── infrastructure/    # Cross-cutting concerns
│   ├── database/      # Prisma, transactions
│   ├── cache/         # Cache service, AuthCacheService
│   ├── logging/       # Pino + CLS
│   ├── metrics/       # Prometheus
│   ├── health/        # Terminus
│   ├── filters/       # Exception filters
│   └── graceful-shutdown/
└── shared/            # Utilities, constants
```
