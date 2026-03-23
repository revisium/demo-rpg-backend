import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import {
  AUTH_CACHE_CONFIG,
  AUTH_CACHE_KEYS,
  AUTH_CACHE_TAGS,
} from '../constants/auth-cache.constants';
import { makeCacheKeyFromArgs } from '../utils/stable-cache-key';

@Injectable()
export class AuthCacheService {
  constructor(private readonly cache: CacheService) {}

  public async rolePermissions<T>(role: string, factory: () => Promise<T>) {
    return this.cache.getOrSet({
      key: AUTH_CACHE_KEYS.ROLE_PERMISSIONS(role),
      ttl: AUTH_CACHE_CONFIG.ROLE_PERMISSIONS_TTL,
      tags: [AUTH_CACHE_TAGS.AUTH_RELATIVES, AUTH_CACHE_TAGS.DICTIONARIES],
      factory,
    });
  }

  public async checkSystemPermission<T>(query: { userId?: string }, factory: () => Promise<T>) {
    return this.cache.getOrSet({
      key: makeCacheKeyFromArgs([query], {
        prefix: AUTH_CACHE_KEYS.CHECK_SYSTEM_PERMISSION,
        version: AUTH_CACHE_CONFIG.KEY_VERSION,
      }),
      ttl: AUTH_CACHE_CONFIG.PERMISSION_CHECK_TTL,
      tags: [
        AUTH_CACHE_TAGS.AUTH_RELATIVES,
        ...(query.userId ? [AUTH_CACHE_TAGS.USER_PERMISSIONS(query.userId)] : []),
      ],
      factory,
    });
  }

  public async invalidateUserPermissions(userId: string) {
    await this.cache.deleteByTag({ tags: [AUTH_CACHE_TAGS.USER_PERMISSIONS(userId)] });
  }

  public async invalidateAllAuthCaches() {
    await this.cache.deleteByTag({ tags: [AUTH_CACHE_TAGS.AUTH_RELATIVES] });
  }

  public async invalidateDictionaries() {
    await this.cache.deleteByTag({ tags: [AUTH_CACHE_TAGS.DICTIONARIES] });
  }
}
