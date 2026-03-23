export class NoopCacheService {
  public getOrSet<T>(options: { factory: () => Promise<T> }): Promise<T> {
    return options.factory();
  }

  public deleteByTag(_options: { tags: string[] }) {
    return false;
  }

  public delete(_options: { key: string }) {
    return false;
  }
}
