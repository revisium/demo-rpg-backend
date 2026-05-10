import { mock } from 'jest-mock-extended';
import { QueryBus } from '@nestjs/cqrs';
import { RegionsApiService } from '../regions-api.service';
import { ListRegionsQuery } from '../queries/impl/list-regions.query';
import { GetRegionQuery } from '../queries/impl/get-region.query';

describe('RegionsApiService', () => {
  it('dispatches ListRegionsQuery with given pagination', async () => {
    const queryBus = mock<QueryBus>();
    queryBus.execute.mockResolvedValue({ edges: [], totalCount: 0 });

    const api = new RegionsApiService(queryBus);
    await api.listRegions({ first: 5, after: 'cursor-2' });

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(ListRegionsQuery));
    const dispatched = queryBus.execute.mock.calls[0]![0] as ListRegionsQuery;
    expect(dispatched.data).toEqual({ first: 5, after: 'cursor-2' });
  });

  it('dispatches GetRegionQuery with regionId', async () => {
    const queryBus = mock<QueryBus>();
    queryBus.execute.mockResolvedValue(null);

    const api = new RegionsApiService(queryBus);
    await api.getRegion({ regionId: 'verdant-marches' });

    expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetRegionQuery));
    const dispatched = queryBus.execute.mock.calls[0]![0] as GetRegionQuery;
    expect(dispatched.data).toEqual({ regionId: 'verdant-marches' });
  });
});
