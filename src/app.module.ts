import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MetricsModule } from './infrastructure/metrics/metrics.module';
import { HealthModule } from './infrastructure/health/health.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { GracefulShutdownModule } from './infrastructure/graceful-shutdown/graceful-shutdown.module';
import { AuthModule } from './features/auth/auth.module';
import { OAuthModule } from './features/oauth/oauth.module';
import { TaskModule } from './features/task/task.module';
import { DictionaryModule } from './features/dictionary/dictionary.module';
import { GraphqlApiModule } from './api/graphql-api/graphql-api.module';
import { RestApiModule } from './api/rest-api/rest-api.module';
import { McpModule } from './api/mcp-api/mcp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CacheModule.forRoot(),

    DatabaseModule,
    LoggingModule,
    MetricsModule,
    HealthModule,
    GracefulShutdownModule,

    AuthModule,
    OAuthModule,
    TaskModule,
    DictionaryModule,

    GraphqlApiModule,
    RestApiModule,
    McpModule,
  ],
})
export class AppModule {}
