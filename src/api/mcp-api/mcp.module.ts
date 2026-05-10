import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from 'src/features/auth/auth.module';
import { OAuthModule } from 'src/features/oauth/oauth.module';
import { RegionsModule } from 'src/features/regions/regions.module';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { McpAuthService } from './mcp-auth.service';
import { RegionsTools } from './tools/regions.tools';

@Module({
  imports: [DatabaseModule, AuthModule, OAuthModule, RegionsModule],
  controllers: [McpController],
  providers: [McpServerService, McpAuthService, RegionsTools],
})
export class McpModule {}
