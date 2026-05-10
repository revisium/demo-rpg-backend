import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { PermissionAction, PermissionSubject } from 'src/features/auth/types';
import { McpAuthHelpers, McpToolRegistrar } from '../types';

const JSON_INDENT = 2;
const MAX_PAGE_SIZE = 100;

@Injectable()
export class RegionsTools implements McpToolRegistrar {
  constructor(private readonly regionsApi: RegionsApiService) {}

  register(server: any, auth: McpAuthHelpers): void {
    server.registerTool(
      'list_regions',
      {
        description:
          'List the regions of Eldoria from the demo-rpg-data dictionary subgraph. Cursor pagination via first / after.',
        inputSchema: {
          first: z
            .number()
            .int()
            .min(1)
            .max(MAX_PAGE_SIZE)
            .default(MAX_PAGE_SIZE)
            .describe('Page size, default 100'),
          after: z.string().optional().describe('Cursor from a previous page (RegionEdge.cursor)'),
        },
        annotations: { readOnlyHint: true },
      },
      async (params: { first?: number; after?: string }) => {
        await auth.checkSystemPermission([
          { action: PermissionAction.read, subject: PermissionSubject.Region },
        ]);
        const result = await this.regionsApi.listRegions({
          first: params.first,
          after: params.after,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, JSON_INDENT) }],
        };
      },
    );

    server.registerTool(
      'get_region',
      {
        description: 'Fetch one Eldoria region by id (e.g. "verdant-marches") from demo-rpg-data.',
        inputSchema: {
          regionId: z.string().min(1).describe('Region row id'),
        },
        annotations: { readOnlyHint: true },
      },
      async (params: { regionId: string }) => {
        await auth.checkSystemPermission([
          { action: PermissionAction.read, subject: PermissionSubject.Region },
        ]);
        const row = await this.regionsApi.getRegion({ regionId: params.regionId });
        if (!row) {
          return {
            content: [{ type: 'text' as const, text: `Region "${params.regionId}" not found` }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(row, null, JSON_INDENT) }],
        };
      },
    );
  }
}
