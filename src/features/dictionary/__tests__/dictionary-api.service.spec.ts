import { mock } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { DictionaryApiService } from '../dictionary-api.service';
import * as sdk from 'src/__generated__/demo-rpg-data';
import { client } from 'src/__generated__/demo-rpg-data/client.gen';

jest.mock('src/__generated__/demo-rpg-data', () => ({
  __esModule: true,
  listRegions: jest.fn(),
  getRegions: jest.fn(),
}));
jest.mock('src/__generated__/demo-rpg-data/client.gen', () => ({
  __esModule: true,
  client: { setConfig: jest.fn() },
}));

const mockedSdk = sdk as jest.Mocked<typeof sdk>;
const mockedClient = client as unknown as { setConfig: jest.Mock };

const buildConfig = (baseUrl: string | undefined) => {
  const config = mock<ConfigService>();
  config.get.mockImplementation((key: string) =>
    key === 'REVISIUM_DEMO_RPG_DATA_URL' ? baseUrl : undefined,
  );
  return config;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DictionaryApiService', () => {
  it('disables itself when REVISIUM_DEMO_RPG_DATA_URL is missing', async () => {
    const service = new DictionaryApiService(buildConfig(undefined));
    service.onModuleInit();

    expect(mockedClient.setConfig).not.toHaveBeenCalled();
    expect(await service.listRegions({})).toBeNull();
    expect(await service.getRegion('any')).toBeNull();
    expect(mockedSdk.listRegions).not.toHaveBeenCalled();
  });

  it('configures the generated client with the configured base URL', () => {
    const service = new DictionaryApiService(
      buildConfig('https://example.test/endpoint/rest/revisium/demo-rpg-data/master/head'),
    );
    service.onModuleInit();

    expect(mockedClient.setConfig).toHaveBeenCalledWith({
      baseUrl: 'https://example.test/endpoint/rest/revisium/demo-rpg-data/master/head',
    });
  });

  it('listRegions delegates to generated SDK with default page size', async () => {
    mockedSdk.listRegions.mockResolvedValue({
      data: {
        edges: [],
        totalCount: 0,
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      error: undefined,
    } as Awaited<ReturnType<typeof sdk.listRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    await service.listRegions({});

    expect(mockedSdk.listRegions).toHaveBeenCalledWith({ body: { first: 100, after: undefined } });
  });

  it('listRegions forwards explicit pagination', async () => {
    mockedSdk.listRegions.mockResolvedValue({
      data: {
        edges: [],
        totalCount: 0,
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      error: undefined,
    } as Awaited<ReturnType<typeof sdk.listRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    await service.listRegions({ first: 25, after: 'c-prev' });

    expect(mockedSdk.listRegions).toHaveBeenCalledWith({ body: { first: 25, after: 'c-prev' } });
  });

  it('listRegions returns null and logs when SDK returns an error', async () => {
    mockedSdk.listRegions.mockResolvedValue({
      data: undefined,
      error: { statusCode: 500, message: 'boom' },
    } as Awaited<ReturnType<typeof sdk.listRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    expect(await service.listRegions({})).toBeNull();
  });

  it('getRegion returns the row payload when SDK succeeds', async () => {
    mockedSdk.getRegions.mockResolvedValue({
      data: {
        id: 'verdant-marches',
        versionId: 'v',
        createdId: 'verdant-marches',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        publishedAt: '',
        readonly: false,
        data: {
          name: { en: 'Verdant', ru: 'V', zh: 'V' },
          description: { en: 'd', ru: 'd', zh: 'd' },
          climate: 'temperate',
        },
      },
      error: undefined,
    } as Awaited<ReturnType<typeof sdk.getRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    const result = await service.getRegion('verdant-marches');

    expect(mockedSdk.getRegions).toHaveBeenCalledWith({ path: { rowId: 'verdant-marches' } });
    expect(result?.id).toBe('verdant-marches');
    expect(result?.data.climate).toBe('temperate');
  });

  it('getRegion returns null on 404', async () => {
    mockedSdk.getRegions.mockResolvedValue({
      data: undefined,
      error: { statusCode: 404, message: 'not found' },
    } as Awaited<ReturnType<typeof sdk.getRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    expect(await service.getRegion('missing')).toBeNull();
  });

  it('getRegion returns null on non-404 errors and logs', async () => {
    mockedSdk.getRegions.mockResolvedValue({
      data: undefined,
      error: { statusCode: 500, message: 'boom' },
    } as Awaited<ReturnType<typeof sdk.getRegions>>);

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    expect(await service.getRegion('x')).toBeNull();
  });

  it('listRegions returns null when SDK promise rejects (transport error)', async () => {
    mockedSdk.listRegions.mockRejectedValue(new Error('ECONNREFUSED'));

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    expect(await service.listRegions({})).toBeNull();
  });

  it('getRegion returns null when SDK promise rejects (transport error)', async () => {
    mockedSdk.getRegions.mockRejectedValue(new Error('ENOTFOUND'));

    const service = new DictionaryApiService(buildConfig('https://example.test'));
    service.onModuleInit();
    expect(await service.getRegion('verdant')).toBeNull();
  });

  it('returns null without calling SDK when disabled', async () => {
    const service = new DictionaryApiService(buildConfig(undefined));
    service.onModuleInit();

    expect(await service.listRegions({})).toBeNull();
    expect(await service.getRegion('x')).toBeNull();
    expect(mockedSdk.listRegions).not.toHaveBeenCalled();
    expect(mockedSdk.getRegions).not.toHaveBeenCalled();
  });
});
