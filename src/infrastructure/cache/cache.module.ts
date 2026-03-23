import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { CACHE_SERVICE } from './cache.tokens';
import { CacheService } from './services/cache.service';
import { NoopCacheService } from './services/noop-cache.service';
import { AuthCacheService } from './services/auth-cache.service';
import { TaskCacheService } from './services/task-cache.service';
import { CACHE_EVENT_HANDLERS } from './handlers';

@Module({})
export class CacheModule {
  static forRoot(): DynamicModule {
    return {
      module: CacheModule,
      global: true,
      imports: [ConfigModule, CqrsModule],
      providers: [
        {
          provide: CACHE_SERVICE,
          useFactory: async (cfg: ConfigService) => {
            const logger = new Logger('CacheModule');
            const enabled = cfg.get('CACHE_ENABLED') === 'true';

            if (!enabled) {
              logger.warn('Cache disabled (NoOp). Set CACHE_ENABLED=true to enable.');
              return new NoopCacheService();
            }

            try {
              const { BentoCache, bentostore } = await import('bentocache');
              const { memoryDriver } = await import('bentocache/drivers/memory');
              const l1MaxSize = cfg.get('CACHE_L1_MAX_SIZE') || '128mb';

              const redisUrl = cfg.get('CACHE_L2_REDIS_URL');

              if (redisUrl) {
                const { redisBusDriver, redisDriver } = await import('bentocache/drivers/redis');
                const Redis = (await import('ioredis')).default;
                const busHost = cfg.getOrThrow<string>('CACHE_BUS_HOST');
                const busPort = cfg.getOrThrow<string>('CACHE_BUS_PORT');

                const bento = new BentoCache({
                  default: 'cache',
                  stores: {
                    cache: bentostore()
                      .useL1Layer(memoryDriver({ maxSize: l1MaxSize }))
                      .useL2Layer(redisDriver({ connection: new Redis(redisUrl) }))
                      .useBus(
                        redisBusDriver({
                          connection: { host: busHost, port: Number.parseInt(busPort, 10) },
                          retryQueue: { enabled: true, maxSize: undefined },
                        }),
                      ),
                  },
                });

                logger.log(`Cache enabled: L1 + L2 (Redis)`);
                return bento;
              }

              const bento = new BentoCache({
                default: 'cache',
                stores: {
                  cache: bentostore().useL1Layer(memoryDriver({ maxSize: l1MaxSize })),
                },
              });

              logger.log('Cache enabled: L1 only (memory)');
              return bento;
            } catch (e) {
              logger.error('BentoCache setup failed, using NoOp fallback.', e);
              return new NoopCacheService();
            }
          },
          inject: [ConfigService],
        },
        CacheService,
        AuthCacheService,
        TaskCacheService,
        ...CACHE_EVENT_HANDLERS,
      ],
      exports: [CacheService, AuthCacheService, TaskCacheService, CACHE_SERVICE],
    };
  }
}
