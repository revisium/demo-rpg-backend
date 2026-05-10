import { mock } from 'jest-mock-extended';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionHandler } from '../queries/handlers/get-region.handler';
import { GetRegionQuery } from '../queries/impl/get-region.query';

describe('GetRegionHandler', () => {
  const validRow = {
    id: 'verdant-marches',
    data: {
      name: { en: 'Verdant Marches', ru: 'Верденские топи', zh: '翠绿沼泽' },
      description: { en: 'd', ru: 'd', zh: 'd' },
      climate: 'temperate' as const,
    },
  };

  it('returns the row when dictionary returns valid shape', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(validRow);

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'verdant-marches' }));

    expect(dictionary.getRegion).toHaveBeenCalledWith('verdant-marches');
    expect(result).toEqual(validRow);
  });

  it('returns null when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(null);

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'missing' }));

    expect(result).toBeNull();
  });

  it('returns null when shape is malformed (data is null)', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue({ id: 'x', data: null });

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'x' }));

    expect(result).toBeNull();
  });

  it('returns null when shape is malformed (id is not a string)', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue({ id: 42, data: { whatever: true } });

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'x' }));

    expect(result).toBeNull();
  });
});
