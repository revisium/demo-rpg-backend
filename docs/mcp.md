# MCP (Model Context Protocol)

## Overview

MCP endpoint allows AI agents (Claude Code, Cursor, etc.) to interact with your API using tools.

- Endpoint: `POST /mcp`
- Transport: Stateless HTTP (no SSE, no WebSocket)
- Auth: Bearer token (JWT or OAuth `oat_` token)

## Architecture

```
POST /mcp → McpController → McpAuthService (extract user)
                           → McpServerService (register tools)
                           → McpServer (handle JSONRPC)
```

Each POST creates a fresh `McpServer` instance. Tools are registered per-request with the authenticated user context.

## Adding New Tools

1. Create tool file: `src/mcp-api/tools/<name>.tools.ts`
2. Implement `McpToolRegistrar` interface
3. Register in `McpServerService.registerTools()`
4. Add to `McpModule` providers

### Tool Pattern

```typescript
@Injectable()
export class TaskTools implements McpToolRegistrar {
  constructor(private readonly taskApi: TaskApiService) {}

  register(server: McpServer, auth: McpAuthHelpers): void {
    server.registerTool(
      'get_tasks',
      {
        description: 'List tasks',
        inputSchema: {
          status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
        },
        annotations: { readOnlyHint: true },
      },
      async (params) => {
        await auth.checkSystemPermission(PermissionAction.read, PermissionSubject.Task);
        const result = await this.taskApi.getTasks({ status: params.status });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }
}
```

## Input Schemas

Use **Zod** for MCP tool input schemas (not class-validator):
```typescript
inputSchema: {
  taskId: z.string().describe('Task ID'),
  title: z.string().optional().describe('New title'),
}
```

## Auth Flow for MCP Clients

1. Client discovers `GET /.well-known/oauth-protected-resource`
2. Client discovers `GET /.well-known/oauth-authorization-server`
3. Client registers via `POST /oauth/register`
4. PKCE authorization code flow via `/oauth/authorize` + `/oauth/token`
5. Client uses `oat_` token in `Authorization: Bearer oat_...` header

See [OAuth documentation](oauth.md) for details.

## Annotations

- `readOnlyHint: true` — indicates the tool doesn't modify data (safe to auto-approve)
- Omit for write operations (create/update/delete)
