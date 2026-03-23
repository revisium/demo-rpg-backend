# GraphQL API

## Setup

Uses **Yoga Federation v2** driver (`@graphql-yoga/nestjs-federation`) with code-first approach.

Configuration in `src/api/graphql-api/graphql-api.module.ts`:
- `autoSchemaFile: { federation: 2 }` — generates federated schema from TypeScript decorators
- GraphiQL playground at `/graphql`

## Adding a New Resolver

1. Create models in `src/api/graphql-api/<name>/models/`
2. Create inputs in `src/api/graphql-api/<name>/inputs/`
3. Create resolver in `src/api/graphql-api/<name>/<name>.resolver.ts`
4. Register resolver in `graphql-api.module.ts`

## Resolver Pattern

```typescript
@UseGuards(GqlAuthGuard)
@Resolver(() => TaskModel)
export class TaskResolver {
  constructor(private readonly taskApi: TaskApiService) {}

  @UseGuards(GqlPermissionGuard)
  @PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })
  @Query(() => TaskModel)
  async task(@Args('taskId') taskId: string) {
    return this.taskApi.getTask({ taskId });
  }

  @UseGuards(GqlPermissionGuard)
  @PermissionParams({ action: PermissionAction.create, subject: PermissionSubject.Task })
  @Mutation(() => IdModel)
  async createTask(@Args('data') data: CreateTaskInput, @CurrentUser() user: IAuthUser) {
    return this.taskApi.createTask({ ...data, userId: user.userId });
  }
}
```

## Models

```typescript
@ObjectType()
export class TaskModel {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;
}
```

## Inputs

```typescript
@InputType()
export class CreateTaskInput {
  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description?: string;
}
```

## Shared Models

- `IdModel` — `{ id: string }` for mutation responses
- `SuccessModel` — `{ success: boolean }` for delete responses

## Guards

- `@UseGuards(GqlAuthGuard)` — require JWT authentication
- `@UseGuards(OptionalGqlAuthGuard)` — allow unauthenticated access
- `@UseGuards(GqlPermissionGuard)` + `@PermissionParams(...)` — CASL permission check
