import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TaskApiService } from 'src/features/task/task-api.service';
import { McpToolRegistrar, McpAuthHelpers } from '../types';

const JSON_INDENT = 2;

@Injectable()
export class TaskTools implements McpToolRegistrar {
  constructor(private readonly taskApi: TaskApiService) {}

  register(server: any, auth: McpAuthHelpers): void {
    server.registerTool(
      'get_tasks',
      {
        description:
          'List tasks. Optional status filter: PENDING, IN_PROGRESS, or COMPLETED. Returns items array and totalCount.',
        inputSchema: {
          status: z.string().describe('Filter by status: PENDING, IN_PROGRESS, COMPLETED'),
        },
        annotations: { readOnlyHint: true },
      },
      async (params: { status?: string }) => {
        await auth.checkSystemPermission([{ action: 'read', subject: 'Task' }]);
        const result = await this.taskApi.getTasks({ status: params.status });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );

    server.registerTool(
      'get_task',
      {
        description: 'Get a task by ID',
        inputSchema: {
          taskId: z.string().describe('Task ID'),
        },
        annotations: { readOnlyHint: true },
      },
      async (params: { taskId: string }) => {
        await auth.checkSystemPermission([{ action: 'read', subject: 'Task' }]);
        const result = await this.taskApi.getTask({ taskId: params.taskId });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );

    server.registerTool(
      'create_task',
      {
        description: 'Create a new task',
        inputSchema: {
          title: z.string().describe('Task title'),
          description: z.string().describe('Task description'),
        },
      },
      async (params: { title: string; description?: string }) => {
        await auth.checkSystemPermission([{ action: 'create', subject: 'Task' }]);
        const result = await this.taskApi.createTask({
          title: params.title,
          description: params.description,
          userId: auth.userId,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );

    server.registerTool(
      'update_task',
      {
        description: 'Update an existing task. Status: PENDING, IN_PROGRESS, or COMPLETED.',
        inputSchema: {
          taskId: z.string().describe('Task ID'),
          title: z.string().optional().describe('New title'),
          description: z.string().optional().describe('New description'),
          status: z.string().optional().describe('New status: PENDING, IN_PROGRESS, COMPLETED'),
        },
      },
      async (params: { taskId: string; title?: string; description?: string; status?: string }) => {
        await auth.checkSystemPermission([{ action: 'update', subject: 'Task' }]);
        const result = await this.taskApi.updateTask({
          taskId: params.taskId,
          title: params.title,
          description: params.description,
          status: params.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | undefined,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );

    server.registerTool(
      'delete_task',
      {
        description: 'Delete a task',
        inputSchema: {
          taskId: z.string().describe('Task ID'),
        },
      },
      async (params: { taskId: string }) => {
        await auth.checkSystemPermission([{ action: 'delete', subject: 'Task' }]);
        const result = await this.taskApi.deleteTask({ taskId: params.taskId });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );
  }
}
