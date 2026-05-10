import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionQuery, GetRegionQueryReturnType } from '../impl/get-region.query';

@QueryHandler(GetRegionQuery)
export class GetRegionHandler implements IQueryHandler<GetRegionQuery> {
  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: GetRegionQuery): Promise<GetRegionQueryReturnType> {
    return this.dictionary.getRegion(query.data.regionId);
  }
}
