# Authentication & Permissions

## JWT Authentication

Access tokens (30 min) stored in httpOnly cookies. Refresh tokens (7 days) enable seamless renewal.

### Auth Flow

1. `POST /api/auth/login` → sets `rev_at` + `rev_rt` cookies
2. Browser sends cookies automatically on all `/api/*` requests
3. Before access token expires, `POST /api/auth/refresh` rotates both tokens
4. `POST /api/auth/logout` clears cookies and revokes token family

### Dual Auth (Cookies + Bearer)

| Consumer | Auth method | Transport |
|---|---|---|
| Browser (admin UI) | httpOnly cookies | Automatic |
| MCP clients | OAuth `oat_` token | `Authorization: Bearer` |
| API consumers | JWT or PAT | `Authorization: Bearer` |

Bearer header takes priority over cookies.

### Token Versioning

Increment `user.tokenVersion` to revoke all sessions instantly:
```typescript
await prisma.user.update({
  where: { id: userId },
  data: { tokenVersion: { increment: 1 } },
});
```

See [JWT Lifecycle docs](jwt-lifecycle.md) for full details.

## Guards

| Guard | Usage | Behavior |
|---|---|---|
| `GqlAuthGuard` | GraphQL, required auth | 401 if no valid JWT |
| `OptionalGqlAuthGuard` | GraphQL, optional auth | Allows unauthenticated |
| `HttpAuthGuard` | REST, required auth | 401 if no valid JWT |
| `OptionalHttpAuthGuard` | REST, optional auth | Allows unauthenticated |
| `GqlPermissionGuard` | GraphQL, CASL check | 403 if insufficient permissions |
| `HttpPermissionGuard` | REST, CASL check | 403 if insufficient permissions |

## CASL Permissions

Permissions are stored in the database (`Permission` table) and linked to roles.

### System-Level Permissions (included in template)

System-level permissions check what a user can do globally:

```typescript
// Guard checks role → permissions from DB
@UseGuards(GqlPermissionGuard)
@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })
@Query(() => TaskModel)
async task(@Args('taskId') taskId: string) { ... }
```

The guard:
1. Gets `roleId` from JWT
2. Loads permissions from DB via `CaslAbilityFactory`
3. Checks `ability.can(action, subject)`

### Adding Organization-Level Permissions

For multi-tenant apps, add organization context to permission checks:

```typescript
// 1. Add condition to permission record
await prisma.permission.create({
  data: {
    action: 'read',
    subject: 'Project',
    condition: { organizationId: '${organizationId}' },  // CASL template
    roleId: 'editor',
  },
});

// 2. Create a guard that resolves organizationId from request
@Injectable()
export class GqlOrganizationPermissionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const args = ctx.getArgs();
    const user = ctx.getContext().req?.user;

    const ability = await this.caslAbilityFactory.createAbility(user.roleId);

    // Check with organization context
    return ability.can('read', subject('Project', {
      organizationId: args.organizationId
    }));
  }
}

// 3. Use in resolver
@UseGuards(GqlAuthGuard, GqlPermissionGuard, GqlOrganizationPermissionGuard)
@Query(() => ProjectModel)
async project(@Args('organizationId') organizationId: string) { ... }
```

### Permission Levels (from simple to complex)

| Level | How It Works | Example |
|---|---|---|
| **System** (template default) | `ability.can(action, subject)` | Admin can manage all |
| **Organization** | `ability.can(action, subject('Resource', { organizationId }))` | Editor in org X |
| **Resource-owner** | `ability.can(action, subject('Resource', { userId }))` | User owns their tasks |

### Adding Permissions

1. Add enum values to `src/auth/types.ts`:
   ```typescript
   export enum PermissionAction {
     manage = 'manage',
     read = 'read',
     create = 'create',
     update = 'update',
     delete = 'delete',
   }

   export enum PermissionSubject {
     all = 'all',
     Task = 'Task',
     User = 'User',
     // Add new subjects here
   }
   ```

2. Add permission records to seed (`prisma/seed/seed.ts`)

3. Use in guards: `@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })`

## No-Auth Mode

Set `NO_AUTH=true` in `.env` for local development. All guards automatically use the admin user.

## @CurrentUser Decorator

Works with both GraphQL and REST:

```typescript
@CurrentUser() user: IAuthUser
// { userId, email, username, roleId }
```
