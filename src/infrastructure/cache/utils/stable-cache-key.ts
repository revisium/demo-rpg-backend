import { createHash } from 'node:crypto';

export function canonicalize(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
}

export function makeCacheKeyFromArgs(
  args: unknown[],
  options: { prefix?: string; version?: number } = {},
): string {
  const canonical = JSON.stringify(args.map(canonicalize));
  const hash = createHash('sha256').update(canonical).digest('base64url');
  const version = options.version ?? 1;
  return options.prefix ? `${options.prefix}:v${version}:${hash}` : `v${version}:${hash}`;
}
