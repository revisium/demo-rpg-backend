import { mock } from 'jest-mock-extended';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { RegionsResolver } from '../regions.resolver';

describe('RegionsResolver', () => {
  const region = {
    id: 'verdant-marches',
    data: {
      name: { en: 'Verdant Marches', ru: 'Верденские топи', zh: '翠绿沼泽' },
      description: { en: 'Wetlands', ru: 'Болота', zh: '湿地' },
      climate: 'temperate' as const,
    },
  };

  it('maps listRegions output to RegionsListModel', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue({ edges: [{ node: region }], totalCount: 1 });

    const resolver = new RegionsResolver(api);
    const result = await resolver.regions({ first: 10, skip: 0 });

    expect(api.listRegions).toHaveBeenCalledWith({ first: 10, skip: 0 });
    expect(result.totalCount).toBe(1);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.id).toBe('verdant-marches');
    expect(result.edges[0]!.climate).toBe('temperate');
  });

  it('treats undefined input as no pagination', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue({ edges: [], totalCount: 0 });

    const resolver = new RegionsResolver(api);
    await resolver.regions();

    expect(api.listRegions).toHaveBeenCalledWith({ first: undefined, skip: undefined });
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
