import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RevisiumClient,
  RevisionScope,
  type RowModel,
  type RowsConnection,
} from '@revisium/client';

const DATA_ORG = 'revisium';
const DATA_PROJECT = 'demo-rpg-data';
const DATA_BRANCH = 'master';
const DEFAULT_PAGE_SIZE = 100;

@Injectable()
export class DictionaryApiService implements OnModuleInit {
  private readonly logger = new Logger(DictionaryApiService.name);
  private client: RevisiumClient | null = null;
  private dataScope: Promise<RevisionScope> | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const baseUrl = this.config.get<string>('REVISIUM_API_URL');
    if (!baseUrl) {
      this.logger.warn('REVISIUM_API_URL not configured; dictionary calls return empty.');
      return;
    }
    const username = this.config.get<string>('REVISIUM_USERNAME');
    const password = this.config.get<string>('REVISIUM_PASSWORD');
    if (!username || !password) {
      this.logger.error(
        'REVISIUM_USERNAME / REVISIUM_PASSWORD not set; dictionary integration disabled.',
      );
      return;
    }
    this.client = new RevisiumClient({ baseUrl });
    try {
      await this.client.login(username, password);
      this.logger.log('Revisium client authenticated');
    } catch (err) {
      this.logger.error('Revisium login failed', err instanceof Error ? err.message : err);
      this.client = null;
    }
  }

  async getRegions(opts: { first?: number; after?: string }): Promise<RowsConnection | null> {
    const scope = await this.getDataScope();
    if (!scope) return null;
    return scope.getRows('regions', {
      first: opts.first ?? DEFAULT_PAGE_SIZE,
      after: opts.after,
    });
  }

  async getRegion(regionId: string): Promise<RowModel | null> {
    const scope = await this.getDataScope();
    if (!scope) return null;
    try {
      return await scope.getRow('regions', regionId);
    } catch (err) {
      this.logger.warn(
        `getRegion failed for ${regionId}: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }
  }

  private async getDataScope(): Promise<RevisionScope | null> {
    if (!this.client) return null;
    this.dataScope ??= this.client.revision({
      org: DATA_ORG,
      project: DATA_PROJECT,
      branch: DATA_BRANCH,
      revision: 'head',
    });
    try {
      return await this.dataScope;
    } catch (err) {
      this.logger.warn(
        `Failed to resolve head scope for ${DATA_ORG}/${DATA_PROJECT}/${DATA_BRANCH}: ${err instanceof Error ? err.message : err}`,
      );
      this.dataScope = null;
      return null;
    }
  }
}
