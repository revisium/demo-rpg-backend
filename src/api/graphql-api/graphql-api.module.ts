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
        // Pin federation @link to v2.3 — the supergraph-builder image (revisium/supergraph-builder:v0.2.2)
        // bundles an @apollo/composition that rejects v2.12 with UNKNOWN_FEDERATION_LINK_VERSION.
        // v2.3 covers everything this subgraph uses (@key, @extends, @external, @shareable).
        federation: {
          version: 2,
          importUrl: 'https://specs.apollo.dev/federation/v2.3',
        },
      },
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    AuthModule,
    RegionsModule,
  ],
  providers: [RegionsResolver, AuthResolver],
})
export class GraphqlApiModule {}
