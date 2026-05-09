import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ListRegionsQuery, ListRegionsQueryReturnType } from './queries/impl/list-regions.query';
import { GetRegionQuery, GetRegionQueryReturnType } from './queries/impl/get-region.query';

@Injectable()
export class RegionsApiService {
  constructor(private readonly queryBus: QueryBus) {}

  async listRegions(data: ListRegionsQuery['data']) {
    return this.queryBus.execute<ListRegionsQuery, ListRegionsQueryReturnType>(
      new ListRegionsQuery(data),
    );
  }

  async getRegion(data: GetRegionQuery['data']) {
    return this.queryBus.execute<GetRegionQuery, GetRegionQueryReturnType>(
      new GetRegionQuery(data),
    );
  }
}
