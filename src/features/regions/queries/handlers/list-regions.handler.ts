import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { ListRegionsQuery, ListRegionsQueryReturnType } from '../impl/list-regions.query';

@QueryHandler(ListRegionsQuery)
export class ListRegionsHandler implements IQueryHandler<ListRegionsQuery> {
  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: ListRegionsQuery): Promise<ListRegionsQueryReturnType> {
    const result = await this.dictionary.listRegions(query.data);

    if (!result) {
      return { edges: [], totalCount: 0, pageInfo: { hasNextPage: false } };
    }

    return {
      edges: result.edges.map((edge) => ({
        cursor: edge.cursor,
        node: { id: edge.node.id, data: edge.node.data },
      })),
      totalCount: result.totalCount,
      pageInfo: {
        endCursor: result.pageInfo.endCursor ?? undefined,
        hasNextPage: result.pageInfo.hasNextPage,
      },
    };
  }
}
