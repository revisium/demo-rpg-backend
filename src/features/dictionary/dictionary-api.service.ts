import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getRegions,
  listRegions,
  type DemoRpgDataRegions,
  type ListRegionsResponses,
} from 'src/__generated__/demo-rpg-data';
import { client } from 'src/__generated__/demo-rpg-data/client.gen';

const DEFAULT_PAGE_SIZE = 100;
const HTTP_NOT_FOUND = 404;

export type RegionRow = {
  id: string;
  data: DemoRpgDataRegions;
};

export type ListRegionsResult = NonNullable<ListRegionsResponses[keyof ListRegionsResponses]>;

@Injectable()
export class DictionaryApiService implements OnModuleInit {
  private readonly logger = new Logger(DictionaryApiService.name);
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const baseUrl = this.config.get<string>('REVISIUM_DEMO_RPG_DATA_URL');
    if (!baseUrl) {
      this.logger.warn(
        'REVISIUM_DEMO_RPG_DATA_URL not configured; demo-rpg-data calls return empty.',
      );
      return;
    }
    client.setConfig({ baseUrl });
    this.enabled = true;
  }

  async listRegions(opts: { first?: number; after?: string }): Promise<ListRegionsResult | null> {
    if (!this.enabled) return null;
    const { data, error } = await listRegions({
      body: { first: opts.first ?? DEFAULT_PAGE_SIZE, after: opts.after },
    });
    if (error) {
      this.logger.warn(`listRegions failed: ${JSON.stringify(error)}`);
      return null;
    }
    return data ?? null;
  }

  async getRegion(regionId: string): Promise<RegionRow | null> {
    if (!this.enabled) return null;
    const { data, error } = await getRegions({ path: { rowId: regionId } });
    if (error) {
      if (isNotFound(error)) return null;
      this.logger.warn(`getRegion failed for ${regionId}: ${JSON.stringify(error)}`);
      return null;
    }
    if (!data) return null;
    return { id: data.id, data: data.data };
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = (error as { statusCode?: unknown }).statusCode;
  return status === HTTP_NOT_FOUND;
}
