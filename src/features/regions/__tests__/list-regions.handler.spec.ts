import { mock } from 'jest-mock-extended';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { ListRegionsHandler } from '../queries/handlers/list-regions.handler';
import { ListRegionsQuery } from '../queries/impl/list-regions.query';
import type { DemoRpgDataRegions } from 'src/__generated__/demo-rpg-data';

function buildRegionData(id: string): DemoRpgDataRegions {
  return {
    name: { en: id, ru: id, zh: id },
    description: { en: 'd', ru: 'd', zh: 'd' },
    climate: 'temperate',
  };
}

function buildResult(ids: string[], totalCount?: number) {
  return {
    edges: ids.map((id, i) => ({
      cursor: `c${i}`,
      node: {
        id,
        versionId: `v-${id}`,
        createdId: id,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        publishedAt: '',
        readonly: false,
        data: buildRegionData(id),
      },
    })),
    totalCount: totalCount ?? ids.length,
    pageInfo: {
      startCursor: ids.length ? 'c0' : null,
      endCursor: ids.length ? `c${ids.length - 1}` : null,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

describe('ListRegionsHandler', () => {
  it('maps edges, totalCount, and pageInfo', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.listRegions.mockResolvedValue(buildResult(['verdant-marches', 'storm-coast'], 2));

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({ first: 10 }));

    expect(dictionary.listRegions).toHaveBeenCalledWith({ first: 10 });
    expect(result.totalCount).toBe(2);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.cursor).toBe('c0');
    expect(result.edges[0]!.node.id).toBe('verdant-marches');
    expect(result.edges[0]!.node.data.climate).toBe('temperate');
    expect(result.pageInfo.endCursor).toBe('c1');
    expect(result.pageInfo.hasNextPage).toBe(false);
  });

  it('returns empty result when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.listRegions.mockResolvedValue(null);

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result).toEqual({ edges: [], totalCount: 0, pageInfo: { hasNextPage: false } });
  });

  it('maps null endCursor to undefined for our public API', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.listRegions.mockResolvedValue(buildResult([], 0));

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result.pageInfo.endCursor).toBeUndefined();
  });

  it('forwards the after cursor', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.listRegions.mockResolvedValue(buildResult([], 0));

    const handler = new ListRegionsHandler(dictionary);
    await handler.execute(new ListRegionsQuery({ first: 5, after: 'cursor-x' }));

    expect(dictionary.listRegions).toHaveBeenCalledWith({ first: 5, after: 'cursor-x' });
  });
});
