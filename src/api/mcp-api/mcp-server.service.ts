import { Injectable, ForbiddenException } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CaslAbilityFactory } from 'src/features/auth/casl-ability.factory';
import { McpAuthHelpers, McpUserContext } from './types';
import { RegionsTools } from './tools/regions.tools';

@Injectable()
export class McpServerService {
  constructor(
    private readonly regionsTools: RegionsTools,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  registerTools(server: McpServer, userContext: McpUserContext): void {
    const auth: McpAuthHelpers = {
      ...userContext,
      checkSystemPermission: async (permissions) => {
        const ability = await this.caslAbilityFactory.createAbility(userContext.roleId);
        for (const p of permissions) {
          if (!ability.can(p.action, p.subject)) {
            throw new ForbiddenException(`Insufficient permissions: ${p.action} ${p.subject}`);
          }
        }
      },
    };

    this.regionsTools.register(server, auth);
  }
}
