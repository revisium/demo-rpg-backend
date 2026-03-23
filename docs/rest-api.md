# REST API

## Setup

Uses **NestJS Swagger** (`@nestjs/swagger`) for OpenAPI documentation.

- Swagger UI: `http://localhost:8080/api`
- OpenAPI JSON: `http://localhost:8080/api-json`

Configuration in `src/rest-api/init-swagger.ts`.

## Adding a New Controller

1. Create DTOs in `src/rest-api/<name>/dto/`
2. Create response models in `src/rest-api/<name>/models/`
3. Create controller in `src/rest-api/<name>/<name>.controller.ts`
4. Register controller in `rest-api.module.ts`

## Controller Pattern

```typescript
@ApiTags('Task')
@ApiBearerAuth('access-token')
@UseGuards(HttpAuthGuard)
@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskApi: TaskApiService) {}

  @Get()
  @UseGuards(HttpPermissionGuard)
  @PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })
  @ApiOperation({ summary: 'List tasks' })
  @ApiOkResponse({ type: TasksListResponseModel })
  @ApiCommonErrors()
  async getTasks(@Query() query: GetTasksDto) {
    return this.taskApi.getTasks({ ...query });
  }

  @Post()
  @ApiCreatedResponse({ type: TaskResponseModel })
  async createTask(@Body() body: CreateTaskDto, @CurrentUser() user: IAuthUser) {
    return this.taskApi.createTask({ ...body, userId: user.userId });
  }
}
```

## DTOs with Validation

```typescript
export class CreateTaskDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```

## Query Parameters with Transform

```typescript
export class GetTasksDto {
  @Transform(({ value }) => Number.parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  first?: number;
}
```

## Shared Decorators

- `@ApiCommonErrors()` — adds 400/401/403 response documentation
- Use `@ApiOperation()` for summary, `@ApiOkResponse()` for response type
