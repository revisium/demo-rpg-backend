import { mock } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { DictionaryApiService } from '../dictionary-api.service';
import { DictionaryProxyService } from '../dictionary-proxy.service';

describe('DictionaryApiService', () => {
  const buildService = (revisionId: string | undefined) => {
    const proxy = mock<DictionaryProxyService>();
    const config = mock<ConfigService>();
    config.get.mockImplementation((key: string) =>
      key === 'REVISIUM_DEMO_RPG_DATA_REVISION_ID' ? revisionId : undefined,
    );
    return { proxy, config, service: new DictionaryApiService(proxy, config) };
  };

  describe('getRegions', () => {
    it('returns null when revision env is not configured', async () => {
      const { proxy, service } = buildService(undefined);
      const result = await service.getRegions({ first: 10, skip: 0 });
      expect(result).toBeNull();
      expect(proxy.getRows).not.toHaveBeenCalled();
    });

    it('forwards pagination options to the proxy when revision is configured', async () => {
      const { proxy, service } = buildService('rev-123');
      proxy.getRows.mockResolvedValue({ edges: [], totalCount: 0 });

      await service.getRegions({ first: 5, skip: 2 });

      expect(proxy.getRows).toHaveBeenCalledWith('regions', 'rev-123', { first: 5, skip: 2 });
    });
  });

  describe('getRegion', () => {
    it('returns null when revision env is not configured', async () => {
      const { proxy, service } = buildService(undefined);
      const result = await service.getRegion('any-id');
      expect(result).toBeNull();
      expect(proxy.getRow).not.toHaveBeenCalled();
    });

    it('forwards regionId to the proxy when revision is configured', async () => {
      const { proxy, service } = buildService('rev-123');
      proxy.getRow.mockResolvedValue({ id: 'verdant-marches', data: {} });

      await service.getRegion('verdant-marches');

      expect(proxy.getRow).toHaveBeenCalledWith('regions', 'verdant-marches', 'rev-123');
    });
  });

  describe('getRows / getRow passthrough', () => {
    it('delegates getRows to proxy with default empty opts', async () => {
      const { proxy, service } = buildService(undefined);
      proxy.getRows.mockResolvedValue({ edges: [] });

      await service.getRows('factions', 'rev-x');

      expect(proxy.getRows).toHaveBeenCalledWith('factions', 'rev-x', {});
    });

    it('delegates getRow to proxy', async () => {
      const { proxy, service } = buildService(undefined);
      proxy.getRow.mockResolvedValue(null);

      await service.getRow('factions', 'order-of-light', 'rev-x');

      expect(proxy.getRow).toHaveBeenCalledWith('factions', 'order-of-light', 'rev-x');
    });
  });
});
