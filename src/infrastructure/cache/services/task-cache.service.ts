import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import {
  TASK_CACHE_CONFIG,
  TASK_CACHE_KEYS,
  TASK_CACHE_TAGS,
} from '../constants/task-cache.constants';
import { makeCacheKeyFromArgs } from '../utils/stable-cache-key';

@Injectable()
export class TaskCacheService {
  constructor(private readonly cache: CacheService) {}

  public async task<T>(taskId: string, factory: () => Promise<T>) {
    return this.cache.getOrSet({
      key: TASK_CACHE_KEYS.TASK(taskId),
      ttl: TASK_CACHE_CONFIG.TASK_TTL,
      tags: [TASK_CACHE_TAGS.TASK_RELATIVES, TASK_CACHE_TAGS.TASK(taskId)],
      factory,
    });
  }

  public async getTasks<T>(args: unknown[], factory: () => Promise<T>) {
    return this.cache.getOrSet({
      key: makeCacheKeyFromArgs(args, {
        prefix: TASK_CACHE_KEYS.GET_TASKS,
        version: TASK_CACHE_CONFIG.KEY_VERSION,
      }),
      ttl: TASK_CACHE_CONFIG.GET_TASKS_TTL,
      tags: [TASK_CACHE_TAGS.TASK_RELATIVES],
      factory,
    });
  }

  public async invalidateTask(taskId: string) {
    await this.cache.deleteByTag({ tags: [TASK_CACHE_TAGS.TASK(taskId)] });
  }

  public async invalidateGetTasks() {
    await this.cache.deleteByTag({ tags: [TASK_CACHE_TAGS.TASK_RELATIVES] });
  }
}
