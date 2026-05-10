import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { RegionsApiService } from 'src/features/regions/regions-api.service';
import { RegionsController } from '../regions.controller';

describe('RegionsController', () => {
  const region = {
    id: 'verdant-marches',
    data: {
      name: { en: 'Verdant Marches', ru: 'Верденские топи', zh: '翠绿沼泽' },
      description: { en: 'd', ru: 'd', zh: 'd' },
      climate: 'temperate' as const,
    },
  };

  it('returns mapped list with totalCount and pageInfo', async () => {
    const api = mock<RegionsApiService>();
    api.listRegions.mockResolvedValue({
      edges: [{ cursor: 'c0', node: region }],
      totalCount: 1,
      pageInfo: { endCursor: 'c0', hasNextPage: false },
    });

    const controller = new RegionsController(api);
    const result = await controller.list({ first: 50 });

    expect(api.listRegions).toHaveBeenCalledWith({ first: 50, after: undefined });
    expect(result.totalCount).toBe(1);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.cursor).toBe('c0');
    expect(result.edges[0]!.node.climate).toBe('temperate');
  });

  it('throws 404 when region is missing', async () => {
    const api = mock<RegionsApiService>();
    api.getRegion.mockResolvedValue(null);

    const controller = new RegionsController(api);

    await expect(controller.get('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns mapped region when found', async () => {
    const api = mock<RegionsApiService>();
    api.getRegion.mockResolvedValue(region);

    const controller = new RegionsController(api);
    const result = await controller.get('verdant-marches');

    expect(api.getRegion).toHaveBeenCalledWith({ regionId: 'verdant-marches' });
    expect(result.id).toBe('verdant-marches');
    expect(result.name.zh).toBe('翠绿沼泽');
  });
});
