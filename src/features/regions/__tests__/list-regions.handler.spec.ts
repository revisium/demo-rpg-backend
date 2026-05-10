import { mock } from 'jest-mock-extended';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { ListRegionsHandler } from '../queries/handlers/list-regions.handler';
import { ListRegionsQuery } from '../queries/impl/list-regions.query';

describe('ListRegionsHandler', () => {
  const buildRow = (id: string) => ({
    id,
    data: {
      name: { en: id, ru: id, zh: id },
      description: { en: 'd', ru: 'd', zh: 'd' },
      climate: 'temperate' as const,
    },
  });

  it('returns mapped edges and totalCount when dictionary returns valid shape', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue({
      edges: [{ node: buildRow('verdant-marches') }, { node: buildRow('storm-coast') }],
      totalCount: 2,
    });

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({ first: 10, skip: 0 }));

    expect(dictionary.getRegions).toHaveBeenCalledWith({ first: 10, skip: 0 });
    expect(result.totalCount).toBe(2);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.node.id).toBe('verdant-marches');
  });

  it('falls back to edges length when totalCount is missing', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue({
      edges: [{ node: buildRow('a') }],
    });

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result.totalCount).toBe(1);
  });

  it('returns empty result when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue(null);

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result).toEqual({ edges: [], totalCount: 0 });
  });

  it('returns empty result when shape is unexpected', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue({ unexpected: true });

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result).toEqual({ edges: [], totalCount: 0 });
  });

  it('skips malformed edges (missing node.id or non-object data)', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegions.mockResolvedValue({
      edges: [
        { node: buildRow('ok') },
        { node: { id: 42, data: {} } },
        { node: { id: 'no-data', data: null } },
        { not: 'an-edge' },
      ],
      totalCount: 4,
    });

    const handler = new ListRegionsHandler(dictionary);
    const result = await handler.execute(new ListRegionsQuery({}));

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.node.id).toBe('ok');
    expect(result.totalCount).toBe(4);
  });
});
