import { mock } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import type { RevisionScope, RowModel, RowsConnection } from '@revisium/client';
import { RevisiumClient } from '@revisium/client';
import { DictionaryApiService } from '../dictionary-api.service';

jest.mock('@revisium/client');

const MockedClient = RevisiumClient as jest.MockedClass<typeof RevisiumClient>;

function buildRow(id: string): RowModel {
  return {
    createdId: id,
    id,
    versionId: `v-${id}`,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    publishedAt: null,
    readonly: false,
    data: { climate: 'temperate' },
  };
}

describe('DictionaryApiService', () => {
  beforeEach(() => {
    MockedClient.mockClear();
  });

  const buildConfig = (
    apiUrl: string | undefined,
    creds: { username?: string; password?: string } = { username: 'u', password: 'p' },
  ) => {
    const config = mock<ConfigService>();
    config.get.mockImplementation((key: string) => {
      if (key === 'REVISIUM_API_URL') return apiUrl;
      if (key === 'REVISIUM_USERNAME') return creds.username;
      if (key === 'REVISIUM_PASSWORD') return creds.password;
      return undefined;
    });
    return config;
  };

  it('skips client init when REVISIUM_API_URL is missing', async () => {
    const service = new DictionaryApiService(buildConfig(undefined));
    await service.onModuleInit();

    expect(MockedClient).not.toHaveBeenCalled();
    expect(await service.getRegions({})).toBeNull();
    expect(await service.getRegion('any')).toBeNull();
  });

  it('skips client init when credentials are missing', async () => {
    const service = new DictionaryApiService(buildConfig('https://example.test', {}));
    await service.onModuleInit();

    expect(MockedClient).not.toHaveBeenCalled();
    expect(await service.getRegions({})).toBeNull();
  });

  it('logs in then resolves the head scope on first request', async () => {
    const scope = mock<RevisionScope>();
    const connection: RowsConnection = {
      edges: [{ cursor: 'c0', node: buildRow('verdant') }],
      totalCount: 1,
      pageInfo: { endCursor: 'c0', hasNextPage: false, hasPreviousPage: false },
    };
    scope.getRows.mockResolvedValue(connection);

    const login = jest.fn().mockResolvedValue(undefined);
    const revision = jest.fn().mockResolvedValue(scope);
    MockedClient.mockImplementation(() => ({ login, revision }) as unknown as RevisiumClient);

    const service = new DictionaryApiService(
      buildConfig('https://example.test', { username: 'alice', password: 's3cret' }),
    );
    await service.onModuleInit();

    expect(login).toHaveBeenCalledWith('alice', 's3cret');

    const result = await service.getRegions({ first: 25, after: 'c-prev' });

    expect(revision).toHaveBeenCalledWith({
      org: 'revisium',
      project: 'demo-rpg-data',
      branch: 'master',
      revision: 'head',
    });
    expect(scope.getRows).toHaveBeenCalledWith('regions', { first: 25, after: 'c-prev' });
    expect(result).toBe(connection);
  });

  it('caches the head scope across calls', async () => {
    const scope = mock<RevisionScope>();
    scope.getRows.mockResolvedValue({
      edges: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    });

    const revision = jest.fn().mockResolvedValue(scope);
    MockedClient.mockImplementation(
      () =>
        ({ login: jest.fn().mockResolvedValue(undefined), revision }) as unknown as RevisiumClient,
    );

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    await service.onModuleInit();

    await service.getRegions({});
    await service.getRegions({ first: 10 });

    expect(revision).toHaveBeenCalledTimes(1);
  });

  it('disables itself when login fails', async () => {
    const login = jest.fn().mockRejectedValue(new Error('401 unauthorized'));
    const revision = jest.fn();
    MockedClient.mockImplementation(() => ({ login, revision }) as unknown as RevisiumClient);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    await service.onModuleInit();

    expect(await service.getRegions({})).toBeNull();
    expect(revision).not.toHaveBeenCalled();
  });

  it('recovers after a transient revision-resolve failure', async () => {
    const scope = mock<RevisionScope>();
    scope.getRows.mockResolvedValue({
      edges: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    });

    const revision = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(scope);
    MockedClient.mockImplementation(
      () =>
        ({ login: jest.fn().mockResolvedValue(undefined), revision }) as unknown as RevisiumClient,
    );

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    await service.onModuleInit();

    expect(await service.getRegions({})).toBeNull();
    expect(await service.getRegions({})).not.toBeNull();
    expect(revision).toHaveBeenCalledTimes(2);
  });

  it('returns null on getRegion when client throws (e.g. 404)', async () => {
    const scope = mock<RevisionScope>();
    scope.getRow.mockRejectedValue(new Error('Row not found'));

    MockedClient.mockImplementation(
      () =>
        ({
          login: jest.fn().mockResolvedValue(undefined),
          revision: jest.fn().mockResolvedValue(scope),
        }) as unknown as RevisiumClient,
    );

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    await service.onModuleInit();

    const result = await service.getRegion('missing');
    expect(result).toBeNull();
    expect(scope.getRow).toHaveBeenCalledWith('regions', 'missing');
  });
});
