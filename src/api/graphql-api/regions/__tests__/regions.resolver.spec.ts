import { mock } from 'jest-mock-extended';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import type { ListRegionsQueryReturnType } from 'src/features/regions/queries/impl/list-regions.query';
import { RegionsResolver } from '../regions.resolver';

const region = {
  id: 'verdant-marches',
  data: {
    name: { en: 'Verdant Marches', ru: 'Верденские топи', zh: '翠绿沼泽' },
    description: { en: 'Wetlands', ru: 'Болота', zh: '湿地' },
    climate: 'temperate' as const,
  },
};

const emptyConnection: ListRegionsQueryReturnType = {
  edges: [],
  totalCount: 0,
  pageInfo: { hasNextPage: false },
};

describe('RegionsResolver', () => {
  it('maps listRegions output to RegionsListModel', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue({
      edges: [{ cursor: 'c0', node: region }],
      totalCount: 1,
      pageInfo: { endCursor: 'c0', hasNextPage: false },
    });

    const resolver = new RegionsResolver(api);
    const result = await resolver.regions({ first: 10, after: 'c-prev' });

    expect(api.listRegions).toHaveBeenCalledWith({ first: 10, after: 'c-prev' });
    expect(result.totalCount).toBe(1);
    expect(result.pageInfo.endCursor).toBe('c0');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.cursor).toBe('c0');
    expect(result.edges[0]!.node.id).toBe('verdant-marches');
    expect(result.edges[0]!.node.climate).toBe('temperate');
  });

  it('treats undefined input as no pagination', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue(emptyConnection);

    const resolver = new RegionsResolver(api);
    await resolver.regions();

    expect(api.listRegions).toHaveBeenCalledWith({ first: undefined, after: undefined });
  });

  it('returns null when region is missing', async () => {
    const api = mock<RegionsApiService>();
    api.getRegion.mockResolvedValue(null);

    const resolver = new RegionsResolver(api);
    const result = await resolver.region('missing');

    expect(result).toBeNull();
  });

  it('maps a single region row to RegionModel', async () => {
    const api = mock<RegionsApiService>();
    api.getRegion.mockResolvedValue(region);

    const resolver = new RegionsResolver(api);
    const result = await resolver.region('verdant-marches');

    expect(api.getRegion).toHaveBeenCalledWith({ regionId: 'verdant-marches' });
    expect(result?.id).toBe('verdant-marches');
    expect(result?.name.en).toBe('Verdant Marches');
  });
});
