export const AUTH_CACHE_KEYS = {
  ROLE_PERMISSIONS: (role: string) => `auth:role:permissions:${role}`,
  CHECK_SYSTEM_PERMISSION: 'auth:check-system-permission',
} as const;

export const AUTH_CACHE_TAGS = {
  AUTH_RELATIVES: 'auth-relatives',
  USER_PERMISSIONS: (userId: string) => `user-permissions-${userId}`,
  DICTIONARIES: 'dictionaries',
} as const;

export const AUTH_CACHE_CONFIG = {
  ROLE_PERMISSIONS_TTL: '1d' as const,
  PERMISSION_CHECK_TTL: '10m' as const,
  KEY_VERSION: 1 as const,
} as const;
