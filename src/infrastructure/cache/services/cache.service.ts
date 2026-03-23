import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { CACHE_SERVICE } from '../cache.tokens';

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(
    @Inject(CACHE_SERVICE)
    private readonly bento: any,
  ) {}

  public async getOrSet<T>(options: {
    key: string;
    ttl?: string;
    tags?: string[];
    factory: () => Promise<T>;
  }): Promise<T> {
    try {
      return await this.bento.getOrSet(options);
    } catch (error: unknown) {
      const cause = (error as { cause?: unknown })?.cause;
      if (
        error instanceof Error &&
        cause instanceof Error &&
        error.message === 'Factory has thrown an error'
      ) {
        throw cause;
      }
      throw error;
    }
  }

  public deleteByTag(options: { tags: string[] }) {
    return this.bento.deleteByTag(options);
  }

  public delete(options: { key: string }) {
    return this.bento.delete(options);
  }

  async onModuleDestroy() {
    if (typeof this.bento.disconnect === 'function') {
      await this.bento.disconnect();
    }
  }
}
