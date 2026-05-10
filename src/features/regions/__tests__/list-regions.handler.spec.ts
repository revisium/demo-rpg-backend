import { mock } from 'jest-mock-extended';
import type { RowModel, RowsConnection } from '@revisium/client';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { ListRegionsHandler } from '../queries/handlers/list-regions.handler';
import { ListRegionsQuery } from '../queries/impl/list-regions.query';

function buildNode(id: string, overrides: Partial<RowModel['data']> = {}): RowModel {
  return {
    createdId: `created-${id}`,
    id,
    versionId: `v-${id}`,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    publishedAt: null,
    readonly: false,
    data: {
      name: { en: id, ru: id, zh: id },
      description: { en: 'd', ru: 'd', zh: 'd' },
      climate: 'temperate',
      ...overrides,
    },
  };
}

function buildConnection(nodes: RowModel[], totalCount?: number): RowsConnection {
  return {
    edges: nodes.map((node, i) => ({ cursor: `c${i}`, node })),
    totalCount: totalCount ?? nodes.length,
    pageInfo: {
      endCursor: nodes.length ? `c${nodes.length - 1}` : undefined,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
}

describe('ListRegionsHandler', () => {
  it('returns mapped edges with cursor + pageInfo when dictionary returns rows', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue(
      buildConnection([buildNode('verdant-marches'), buildNode('storm-coast')], 2),
    );

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({ first: 10 }));

    expect(dictionary.getRegions).toHaveBeenCalledWith({ first: 10, after: undefined });
    expect(result.totalCount).toBe(2);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.node.id).toBe('verdant-marches');
    expect(result.edges[0]!.cursor).toBe('c0');
  });

  it('returns empty result when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue(null);

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result).toEqual({ edges: [], totalCount: 0, pageInfo: { hasNextPage: false } });
  });

  it('skips malformed rows (non-string climate, missing locale keys)', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue(
      buildConnection(
        [
          buildNode('ok'),
          buildNode('bad-climate', { climate: 42 }),
          buildNode('bad-name', { name: { en: 'x' } }),
        ],
        3,
      ),
    );

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.node.id).toBe('ok');
    expect(result.totalCount).toBe(3);
  });

  it('forwards the after cursor to the dictionary', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue(buildConnection([], 0));

    const handler = new ListRegionsHandler(dictionary);
    await handler.execute(new ListRegionsQuery({ first: 5, after: 'cursor-x' }));

    expect(dictionary.getRegions).toHaveBeenCalledWith({ first: 5, after: 'cursor-x' });
  });
});
