# Adding MCP Tools

## Step 1: Create Tool File

```typescript
// src/api/mcp-api/tools/project.tools.ts
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ProjectApiService } from 'src/features/project/project-api.service';
import { McpToolRegistrar, McpAuthHelpers } from '../types';

@Injectable()
export class ProjectTools implements McpToolRegistrar {
  constructor(private readonly projectApi: ProjectApiService) {}

  register(server: McpServer, auth: McpAuthHelpers): void {
    server.registerTool(
      'get_projects',
      {
        description: 'List all projects',
        inputSchema: {},
        annotations: { readOnlyHint: true },
      },
      async () => {
        await auth.checkSystemPermission(PermissionAction.read, PermissionSubject.Project);
        const result = await this.projectApi.getProjects({ userId: auth.userId });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  }
}
```

## Step 2: Register in McpServerService

```typescript
// src/api/mcp-api/mcp-server.service.ts
@Injectable()
export class McpServerService {
  constructor(
    private readonly taskTools: TaskTools,
    private readonly projectTools: ProjectTools,  // Add
  ) {}

  registerTools(server: McpServer, auth: McpAuthHelpers): void {
    this.taskTools.register(server, auth);
    this.projectTools.register(server, auth);  // Add
  }
}
```

## Step 3: Add to McpModule

```typescript
// src/api/mcp-api/mcp.module.ts
@Module({
  imports: [..., ProjectModule],
  providers: [..., ProjectTools],
})
export class McpModule {}
```

## Tool Naming Conventions

- `get_<resource>` — single resource by ID
- `get_<resources>` — list resources
- `create_<resource>` — create
- `update_<resource>` — update
- `delete_<resource>` — delete
- `search_<resources>` — search/filter

## Annotations

```typescript
annotations: {
  readOnlyHint: true,    // Read-only (safe to auto-approve)
  // Omit for write operations
}
```

## Response Format

Always return `{ content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }`.
