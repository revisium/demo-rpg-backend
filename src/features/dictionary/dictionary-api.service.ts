import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DictionaryProxyService } from './dictionary-proxy.service';

@Injectable()
export class DictionaryApiService {
  private readonly logger = new Logger(DictionaryApiService.name);

  constructor(
    private readonly proxy: DictionaryProxyService,
    private readonly config: ConfigService,
  ) {}

  async getRows(tableId: string, revisionId: string, opts: { first?: number; skip?: number } = {}) {
    return this.proxy.getRows(tableId, revisionId, opts);
  }

  async getRow(tableId: string, rowId: string, revisionId: string) {
    return this.proxy.getRow(tableId, rowId, revisionId);
  }

  async getRegions(opts: { first?: number; skip?: number }) {
    const revisionId = this.dataRevisionId();
    if (!revisionId) return null;
    return this.proxy.getRows('regions', revisionId, opts);
  }

  async getRegion(regionId: string) {
    const revisionId = this.dataRevisionId();
    if (!revisionId) return null;
    return this.proxy.getRow('regions', regionId, revisionId);
  }

  private dataRevisionId(): string | null {
    const rev = this.config.get<string>('REVISIUM_DEMO_RPG_DATA_REVISION_ID');
    if (!rev) {
      this.logger.warn(
        'REVISIUM_DEMO_RPG_DATA_REVISION_ID not configured; demo-rpg-data calls return empty.',
      );
      return null;
    }
    return rev;
  }
}
