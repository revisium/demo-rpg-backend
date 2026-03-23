import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { AuthModule } from 'src/features/auth/auth.module';
import { OAuthModule } from 'src/features/oauth/oauth.module';
import { TaskModule } from 'src/features/task/task.module';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { McpAuthService } from './mcp-auth.service';
import { TaskTools } from './tools/task.tools';

@Module({
  imports: [DatabaseModule, AuthModule, OAuthModule, TaskModule],
  controllers: [McpController],
  providers: [McpServerService, McpAuthService, TaskTools],
})
export class McpModule {}
