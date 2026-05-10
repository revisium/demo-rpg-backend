import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionQuery, GetRegionQueryReturnType } from '../impl/get-region.query';
import { RegionRow } from '../impl/list-regions.query';

@QueryHandler(GetRegionQuery)
export class GetRegionHandler implements IQueryHandler<GetRegionQuery> {
  private readonly logger = new Logger(GetRegionHandler.name);

  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: GetRegionQuery): Promise<GetRegionQueryReturnType> {
    const result = await this.dictionary.getRegion(query.data.regionId);

    if (result === null) return null;

    if (!isRegionRow(result)) {
      this.logger.warn(`Dictionary returned an unexpected shape for region ${query.data.regionId}`);
      return null;
    }

    return result;
  }
}

function isRegionRow(value: unknown): value is RegionRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as { id?: unknown; data?: unknown };
  return typeof v.id === 'string' && typeof v.data === 'object' && v.data !== null;
}
