import { canonicalize, makeCacheKeyFromArgs } from '../stable-cache-key';

describe('canonicalize', () => {
  it.each([
    { input: null, expected: null, label: 'null' },
    { input: undefined, expected: undefined, label: 'undefined' },
    { input: 42, expected: 42, label: 'number' },
    { input: 'hello', expected: 'hello', label: 'string' },
    { input: true, expected: true, label: 'boolean' },
  ])('returns $label as-is', ({ input, expected }) => {
    expect(canonicalize(input)).toBe(expected);
  });

  it('sorts object keys alphabetically', () => {
    const result = canonicalize({ c: 3, a: 1, b: 2 });
    expect(Object.keys(result as object)).toEqual(['a', 'b', 'c']);
  });

  it('filters out undefined values', () => {
    const result = canonicalize({ a: 1, b: undefined, c: 3 });
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('preserves null values', () => {
    const result = canonicalize({ a: 1, b: null });
    expect(result).toEqual({ a: 1, b: null });
  });

  it('recursively canonicalizes nested objects', () => {
    const result = canonicalize({ z: { b: 2, a: 1 }, a: 1 }) as Record<string, unknown>;
    const keys = Object.keys(result);
    const nestedKeys = Object.keys(result.z as Record<string, unknown>);
    expect(keys).toEqual(['a', 'z']);
    expect(nestedKeys).toEqual(['a', 'b']);
  });

  it('recursively canonicalizes arrays of objects', () => {
    const result = canonicalize([{ b: 2, a: 1 }]) as Record<string, unknown>[];
    expect(Object.keys(result[0]!)).toEqual(['a', 'b']);
  });
});

describe('makeCacheKeyFromArgs', () => {
  it.each([
    { label: 'different key order', a: [{ b: 2, a: 1 }], b: [{ a: 1, b: 2 }] },
    { label: 'undefined fields treated as absent', a: [{ a: 1 }], b: [{ a: 1, b: undefined }] },
  ])('produces same key for $label', ({ a, b }) => {
    expect(makeCacheKeyFromArgs(a)).toBe(makeCacheKeyFromArgs(b));
  });

  it.each([
    { label: 'different values', a: [{ userId: 'user-1' }], b: [{ userId: 'user-2' }] },
    { label: 'null vs absent', a: [{ a: null }], b: [{}] },
  ])('produces different keys for $label', ({ a, b }) => {
    expect(makeCacheKeyFromArgs(a)).not.toBe(makeCacheKeyFromArgs(b));
  });

  it('adds prefix and default version', () => {
    const key = makeCacheKeyFromArgs([{ a: 1 }], { prefix: 'auth:check' });
    expect(key).toMatch(/^auth:check:v1:/);
  });

  it('respects custom version', () => {
    const v1 = makeCacheKeyFromArgs([{ a: 1 }], { version: 1 });
    const v2 = makeCacheKeyFromArgs([{ a: 1 }], { version: 2 });
    expect(v1).not.toBe(v2);
  });
});
