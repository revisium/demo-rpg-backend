import { mock } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { DictionaryProxyService } from '../dictionary-proxy.service';

describe('DictionaryProxyService', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const build = (apiUrl: string | undefined) => {
    const config = mock<ConfigService>();
    config.get.mockImplementation((key: string) => {
      if (key === 'REVISIUM_API_URL') return apiUrl;
      if (key === 'REVISIUM_USERNAME') return 'admin';
      if (key === 'REVISIUM_PASSWORD') return 'admin';
      return undefined;
    });
    return new DictionaryProxyService(config);
  };

  describe('getRows', () => {
    it('returns empty edges when REVISIUM_API_URL is not configured', async () => {
      const proxy = build(undefined);
      await proxy.onModuleInit();
      const result = await proxy.getRows('regions', 'rev-1');
      expect(result).toEqual({ edges: [] });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('encodes path segments and forwards pagination via URLSearchParams', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token-abc' }),
      });
      await proxy.onModuleInit();

      const responsePayload = { edges: [{ node: { id: 'a' } }], totalCount: 1 };
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => responsePayload });

      const result = await proxy.getRows('regions', 'rev/1', { first: 25, skip: 5 });

      expect(result).toEqual(responsePayload);
      const callUrl = fetchMock.mock.calls[1][0] as string;
      expect(callUrl).toContain('/api/revision/rev%2F1/tables/regions/rows?');
      expect(callUrl).toContain('first=25');
      expect(callUrl).toContain('skip=5');
    });

    it('returns empty edges when upstream responds non-OK', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token-abc' }),
      });
      await proxy.onModuleInit();

      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

      const result = await proxy.getRows('regions', 'rev-1');
      expect(result).toEqual({ edges: [] });
    });

    it('returns empty edges when fetch throws', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token-abc' }),
      });
      await proxy.onModuleInit();

      fetchMock.mockRejectedValueOnce(new Error('boom'));

      const result = await proxy.getRows('regions', 'rev-1');
      expect(result).toEqual({ edges: [] });
    });
  });

  describe('getRow', () => {
    it('returns null when REVISIUM_API_URL is not configured', async () => {
      const proxy = build(undefined);
      await proxy.onModuleInit();
      const result = await proxy.getRow('regions', 'verdant', 'rev-1');
      expect(result).toBeNull();
    });

    it('encodes rowId in URL path', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token-abc' }),
      });
      await proxy.onModuleInit();

      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'a/b' }) });

      await proxy.getRow('regions', 'a/b', 'rev-1');

      const callUrl = fetchMock.mock.calls[1][0] as string;
      expect(callUrl).toContain('/api/revision/rev-1/tables/regions/rows/a%2Fb');
    });

    it('returns null when upstream responds non-OK', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'token-abc' }),
      });
      await proxy.onModuleInit();

      fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });

      const result = await proxy.getRow('regions', 'missing', 'rev-1');
      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('logs but does not throw when auth fails', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
      await expect(proxy.onModuleInit()).resolves.toBeUndefined();
    });

    it('logs but does not throw when auth fetch errors', async () => {
      const proxy = build('https://example.test');
      fetchMock.mockRejectedValueOnce(new Error('network'));
      await expect(proxy.onModuleInit()).resolves.toBeUndefined();
    });
  });
});
