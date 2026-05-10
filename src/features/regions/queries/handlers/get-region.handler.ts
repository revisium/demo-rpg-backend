import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionQuery, GetRegionQueryReturnType } from '../impl/get-region.query';
import { toRegionRow } from './list-regions.handler';

@QueryHandler(GetRegionQuery)
export class GetRegionHandler implements IQueryHandler<GetRegionQuery> {
  private readonly logger = new Logger(GetRegionHandler.name);

  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: GetRegionQuery): Promise<GetRegionQueryReturnType> {
    const result = await this.dictionary.getRegion(query.data.regionId);

    if (result === null) return null;

    const region = toRegionRow(result);
    if (!region) {
      this.logger.warn(`Region ${query.data.regionId} has malformed data; returning not-found`);
      return null;
    }
    return region;
  }
}
