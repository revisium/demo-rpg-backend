export const TASK_CACHE_KEYS = {
  TASK: (taskId: string) => `task:${taskId}`,
  GET_TASKS: 'task:get-tasks',
} as const;

export const TASK_CACHE_TAGS = {
  TASK_RELATIVES: 'task-relatives',
  TASK: (taskId: string) => `task:${taskId}`,
} as const;

export const TASK_CACHE_CONFIG = {
  TASK_TTL: '5m' as const,
  GET_TASKS_TTL: '1m' as const,
  KEY_VERSION: 1 as const,
} as const;
