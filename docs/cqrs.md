# CQRS (Command Query Responsibility Segregation)

## Overview

Every domain uses CQRS with separate commands (write) and queries (read).

## File Structure

```
src/features/<name>/
├── <name>.module.ts           # NestJS module
├── <name>-api.service.ts      # Facade (CommandBus + QueryBus)
├── commands/
│   ├── impl/
│   │   ├── create-<name>.command.ts
│   │   └── update-<name>.command.ts
│   └── handlers/
│       ├── create-<name>.handler.ts
│       ├── update-<name>.handler.ts
│       ├── __tests__/
│       └── index.ts           # export COMMANDS = [...]
├── queries/
│   ├── impl/
│   │   ├── get-<name>.query.ts
│   │   └── get-<name>s.query.ts
│   └── handlers/
│       ├── get-<name>.handler.ts
│       ├── get-<name>s.handler.ts
│       ├── __tests__/
│       └── index.ts           # export QUERIES = [...]
├── events/                    # Optional
│   ├── impl/
│   └── handlers/
└── services/                  # Optional domain services
```

## Command Pattern

```typescript
// impl/create-task.command.ts
export class CreateTaskCommand {
  constructor(public readonly data: {
    title: string;
    description?: string;
    userId: string;
  }) {}
}
export type CreateTaskCommandReturnType = { id: string };

// handlers/create-task.handler.ts
@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler
  implements ICommandHandler<CreateTaskCommand, CreateTaskCommandReturnType>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute({ data }: CreateTaskCommand): Promise<CreateTaskCommandReturnType> {
    const task = await this.prisma.task.create({ data });
    return { id: task.id };
  }
}
```

## Query Pattern

```typescript
// impl/get-task.query.ts
export class GetTaskQuery {
  constructor(public readonly data: { taskId: string }) {}
}
export type GetTaskQueryReturnType = { id: string; title: string; ... };

// handlers/get-task.handler.ts
@QueryHandler(GetTaskQuery)
export class GetTaskHandler
  implements IQueryHandler<GetTaskQuery, GetTaskQueryReturnType>
{
  async execute({ data }: GetTaskQuery) {
    return this.prisma.task.findUniqueOrThrow({ where: { id: data.taskId } });
  }
}
```

## API Service Facade

```typescript
@Injectable()
export class TaskApiService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createTask(data: CreateTaskCommand['data']) {
    return this.commandBus.execute<CreateTaskCommand, CreateTaskCommandReturnType>(
      new CreateTaskCommand(data),
    );
  }
}
```

## Registering Handlers

```typescript
// handlers/index.ts
export const TASK_COMMANDS = [CreateTaskHandler, UpdateTaskHandler, DeleteTaskHandler];
export const TASK_QUERIES = [GetTaskHandler, GetTasksHandler];

// task.module.ts
@Module({
  imports: [CqrsModule, DatabaseModule],
  providers: [TaskApiService, ...TASK_COMMANDS, ...TASK_QUERIES],
  exports: [TaskApiService],
})
export class TaskModule {}
```

## Rules

- Commands change state, queries only read
- **Command return types: only `{ id: string }`, `void`, or `{ success: boolean }`** — commands never return full entity data
- **Exception**: Auth commands (login) may return tokens — this is an accepted deviation
- Queries can return any data shape
- Handlers contain business logic, not resolvers/controllers
- Always define return types explicitly
- Use `data` property for command/query input
- Export handler arrays in `index.ts`
- Each domain module has an **API service** (`*-api.service.ts`) — the only public interface of the domain
- Resolvers, controllers, and MCP tools call API services, never handlers directly
