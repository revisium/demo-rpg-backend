import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import {
  ListRegionsQuery,
  ListRegionsQueryReturnType,
  RegionRow,
} from '../impl/list-regions.query';

@QueryHandler(ListRegionsQuery)
export class ListRegionsHandler implements IQueryHandler<ListRegionsQuery> {
  private readonly logger = new Logger(ListRegionsHandler.name);

  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: ListRegionsQuery): Promise<ListRegionsQueryReturnType> {
    const result = await this.dictionary.getRegions(query.data);

    if (!isRegionsListResult(result)) {
      this.logger.warn('Dictionary returned an unexpected shape for regions');
      return { edges: [], totalCount: 0 };
    }

    return {
      edges: result.edges.map((edge) => ({ node: edge.node })),
      totalCount: result.totalCount ?? result.edges.length,
    };
  }
}

function isRegionsListResult(
  value: unknown,
): value is { edges: { node: RegionRow }[]; totalCount?: number } {
  if (!value || typeof value !== 'object') return false;
  const v = value as { edges?: unknown };
  return Array.isArray(v.edges);
}
