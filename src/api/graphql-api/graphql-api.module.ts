import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaFederationDriver, YogaFederationDriverConfig } from '@graphql-yoga/nestjs-federation';
import { AuthModule } from 'src/features/auth/auth.module';
import { RegionsModule } from 'src/features/regions/regions.module';
import { RegionsResolver } from './regions/regions.resolver';
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
    RegionsModule,
  ],
  providers: [RegionsResolver, AuthResolver],
})
export class GraphqlApiModule {}
