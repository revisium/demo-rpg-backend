import { TaskCreatedCacheHandler } from './task-created-cache.handler';
import { TaskUpdatedCacheHandler } from './task-updated-cache.handler';
import { TaskDeletedCacheHandler } from './task-deleted-cache.handler';

export const CACHE_EVENT_HANDLERS = [
  TaskCreatedCacheHandler,
  TaskUpdatedCacheHandler,
  TaskDeletedCacheHandler,
];
