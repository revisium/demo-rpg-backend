# Caching

## Architecture

```
CacheModule.forRoot()
├── BentoCache (L1 memory + optional L2 Redis + bus)  — when CACHE_ENABLED=true
├── NoopCacheService (pass-through)                    — when CACHE_ENABLED=false
├── CacheService (wrapper: getOrSet, deleteByTag, delete, disconnect)
├── AuthCacheService (permission caching)
├── TaskCacheService (domain cache example)
└── Event handlers (cache invalidation on CQRS events)
```

## CacheService

Wraps BentoCache with error unwrapping and graceful disconnect:

```typescript
@Injectable()
export class CacheService implements OnModuleDestroy {
  public async getOrSet<T>(options: {
    key: string;
    ttl?: string;
    tags?: string[];
    factory: () => Promise<T>;
  }): Promise<T> { ... }

  public deleteByTag(options: { tags: string[] }) { ... }
  public delete(options: { key: string }) { ... }
  async onModuleDestroy() { await this.bento.disconnect(); }
}
```

## Tag-Based Invalidation

Every cached value can have **tags**. Calling `deleteByTag({ tags })` removes all entries with those tags:

```typescript
await cache.getOrSet({
  key: 'task:123',
  ttl: '5m',
  tags: ['task-relatives', 'task:123'],
  factory: () => prisma.task.findUnique({ where: { id: '123' } }),
});

await cache.deleteByTag({ tags: ['task:123'] });
await cache.deleteByTag({ tags: ['task-relatives'] });
```

## Stable Cache Keys

Use `makeCacheKeyFromArgs()` for deterministic keys from query parameters:

```typescript
import { makeCacheKeyFromArgs } from 'src/infrastructure/cache/utils/stable-cache-key';

const key = makeCacheKeyFromArgs([{ userId: 'u1', status: 'PENDING' }], {
  prefix: 'task:get-tasks',
  version: 1,
});
```

Features:
- Canonicalizes objects (sorts keys, removes undefined)
- SHA-256 hashes the JSON representation
- Version field enables cache invalidation on format changes

## AuthCacheService

Caches role permissions and system permission checks:

```typescript
const permissions = await authCache.rolePermissions('admin', () =>
  prisma.permission.findMany({ where: { roleId: 'admin' } }),
);

await authCache.checkSystemPermission({ userId }, () =>
  ability.can(action, subject),
);

await authCache.invalidateUserPermissions(userId);
await authCache.invalidateAllAuthCaches();
```

## Domain Cache (TaskCacheService Example)

Pattern for domain-specific caching:

```typescript
@Injectable()
export class TaskCacheService {
  constructor(private readonly cache: CacheService) {}

  public async task<T>(taskId: string, factory: () => Promise<T>) {
    return this.cache.getOrSet({
      key: TASK_CACHE_KEYS.TASK(taskId),
      ttl: TASK_CACHE_CONFIG.TASK_TTL,
      tags: [TASK_CACHE_TAGS.TASK_RELATIVES, TASK_CACHE_TAGS.TASK(taskId)],
      factory,
    });
  }

  public async invalidateTask(taskId: string) {
    await this.cache.deleteByTag({ tags: [TASK_CACHE_TAGS.TASK(taskId)] });
  }

  public async invalidateGetTasks() {
    await this.cache.deleteByTag({ tags: [TASK_CACHE_TAGS.TASK_RELATIVES] });
  }
}
```

Usage in API service:
```typescript
async getTask(data: { taskId: string }) {
  return this.taskCache.task(data.taskId, () =>
    this.queryBus.execute(new GetTaskQuery(data)),
  );
}
```

## Event-Driven Invalidation

Command handlers publish CQRS events, cache handlers invalidate:

```typescript
@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler {
  async execute({ data }: CreateTaskCommand) {
    const task = await this.prisma.task.create({ data });
    this.eventBus.publish(new TaskCreatedEvent(task.id, data.userId));
    return { id: task.id };
  }
}

@EventsHandler(TaskCreatedEvent)
export class TaskCreatedCacheHandler {
  async handle(_event: TaskCreatedEvent) {
    await this.taskCache.invalidateGetTasks();
  }
}
```

Event → handler mapping:
| Event | Cache Invalidation |
|---|---|
| `TaskCreatedEvent` | `invalidateGetTasks()` |
| `TaskUpdatedEvent` | `invalidateTask(id)` + `invalidateGetTasks()` |
| `TaskDeletedEvent` | `invalidateTask(id)` + `invalidateGetTasks()` |

## Cache Constants

Organize keys, tags, and config per domain:

```typescript
export const TASK_CACHE_KEYS = {
  TASK: (taskId: string) => `task:${taskId}`,
  GET_TASKS: 'task:get-tasks',
} as const;

export const TASK_CACHE_TAGS = {
  TASK_RELATIVES: 'task-relatives',
  TASK: (taskId: string) => `task:${taskId}`,
} as const;

export const TASK_CACHE_CONFIG = {
  TASK_TTL: '5m' as const,
  GET_TASKS_TTL: '1m' as const,
  KEY_VERSION: 1 as const,
} as const;
```

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `CACHE_ENABLED` | `false` | Enable BentoCache |
| `CACHE_L1_MAX_SIZE` | `128mb` | Memory cache size |
| `CACHE_L2_REDIS_URL` | — | Redis URL for L2 layer |
| `CACHE_BUS_HOST` | — | Redis host for distributed invalidation |
| `CACHE_BUS_PORT` | — | Redis port for distributed invalidation |

## Modes

| Mode | Layers | Use Case |
|---|---|---|
| Disabled (`CACHE_ENABLED=false`) | NoopCacheService | Development, testing |
| L1 only | Memory | Single instance, no Redis |
| L1 + L2 + Bus | Memory + Redis + Redis Bus | Multi-instance production |
