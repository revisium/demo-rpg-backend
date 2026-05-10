import { mock } from 'jest-mock-extended';
import type { RowModel } from '@revisium/client';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionHandler } from '../queries/handlers/get-region.handler';
import { GetRegionQuery } from '../queries/impl/get-region.query';

function buildRow(id: string, overrides: Partial<RowModel['data']> = {}): RowModel {
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

describe('GetRegionHandler', () => {
  it('returns the typed region when dictionary returns a valid row', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(buildRow('verdant-marches'));

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'verdant-marches' }));

    expect(dictionary.getRegion).toHaveBeenCalledWith('verdant-marches');
    expect(result?.id).toBe('verdant-marches');
    expect(result?.data.climate).toBe('temperate');
  });

  it('returns null when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(null);

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'missing' }));

    expect(result).toBeNull();
  });

  it('returns null when row payload is malformed', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(buildRow('x', { climate: 99 }));

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'x' }));

    expect(result).toBeNull();
  });
});
