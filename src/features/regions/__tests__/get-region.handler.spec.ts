import { mock } from 'jest-mock-extended';
import { DictionaryApiService } from 'src/features/dictionary/dictionary-api.service';
import { GetRegionHandler } from '../queries/handlers/get-region.handler';
import { GetRegionQuery } from '../queries/impl/get-region.query';

const region = {
  id: 'verdant-marches',
  data: {
    name: { en: 'Verdant Marches', ru: 'Верденские топи', zh: '翠绿沼泽' },
    description: { en: 'Wetlands', ru: 'Болота', zh: '湿地' },
    climate: 'temperate' as const,
  },
};

describe('GetRegionHandler', () => {
  it('returns the row when dictionary finds it', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(region);

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'verdant-marches' }));

    expect(dictionary.getRegion).toHaveBeenCalledWith('verdant-marches');
    expect(result).toBe(region);
  });

  it('returns null when dictionary returns null', async () => {
    const dictionary = mock<DictionaryApiService>();
    dictionary.getRegion.mockResolvedValue(null);

    const handler = new GetRegionHandler(dictionary);
    const result = await handler.execute(new GetRegionQuery({ regionId: 'missing' }));

    expect(result).toBeNull();
  });
});
