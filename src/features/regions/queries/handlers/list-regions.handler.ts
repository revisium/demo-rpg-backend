import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RowModel } from '@revisium/client';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import {
  ListRegionsQuery,
  ListRegionsQueryReturnType,
  LocalizedString,
  RegionRow,
  REGION_CLIMATES,
  RegionClimate,
} from '../impl/list-regions.query';

@QueryHandler(ListRegionsQuery)
export class ListRegionsHandler implements IQueryHandler<ListRegionsQuery> {
  private readonly logger = new Logger(ListRegionsHandler.name);

  constructor(private readonly dictionary: DictionaryApiService) {}

  async execute(query: ListRegionsQuery): Promise<ListRegionsQueryReturnType> {
    const result = await this.dictionary.getRegions(query.data);

    if (!result) {
      return { edges: [], totalCount: 0, pageInfo: { hasNextPage: false } };
    }

    const edges: { cursor: string; node: RegionRow }[] = [];
    for (const edge of result.edges) {
      const region = toRegionRow(edge.node);
      if (region) {
        edges.push({ cursor: edge.cursor, node: region });
      } else {
        this.logger.warn(`Skipping region row ${edge.node.id}: malformed data`);
      }
    }

    return {
      edges,
      totalCount: result.totalCount,
      pageInfo: {
        endCursor: result.pageInfo.endCursor,
        hasNextPage: result.pageInfo.hasNextPage,
      },
    };
  }
}

export function toRegionRow(node: RowModel): RegionRow | null {
  const raw: unknown = node.data;
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as { name?: unknown; description?: unknown; climate?: unknown };
  if (!isLocalized(data.name) || !isLocalized(data.description)) return null;
  if (!isClimate(data.climate)) return null;
  return {
    id: node.id,
    data: {
      name: data.name,
      description: data.description,
      climate: data.climate,
    },
  };
}

function isLocalized(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object') return false;
  const v = value as { en?: unknown; ru?: unknown; zh?: unknown };
  return typeof v.en === 'string' && typeof v.ru === 'string' && typeof v.zh === 'string';
}

function isClimate(value: unknown): value is RegionClimate {
  return typeof value === 'string' && (REGION_CLIMATES as readonly string[]).includes(value);
}
