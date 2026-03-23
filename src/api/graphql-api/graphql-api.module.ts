import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation';
import { AuthModule } from 'src/features/auth/auth.module';
import { TaskModule } from 'src/features/task/task.module';
import { TaskResolver } from './task/task.resolver';
import { AuthResolver } from './auth/auth.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaFederationDriverConfig>({
      driver: YogaFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    AuthModule,
    TaskModule,
  ],
  providers: [TaskResolver, AuthResolver],
})
export class GraphqlApiModule {}
