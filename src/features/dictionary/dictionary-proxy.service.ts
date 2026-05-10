import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DictionaryProxyService implements OnModuleInit {
  private readonly logger = new Logger(DictionaryProxyService.name);
  private apiUrl = '';
  private token = '';
  private timeoutMs = DEFAULT_TIMEOUT_MS;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.apiUrl = this.configService.get('REVISIUM_API_URL') || '';
    this.timeoutMs = parseTimeoutMs(this.configService.get('REVISIUM_HTTP_TIMEOUT_MS'));
    if (!this.apiUrl) {
      this.logger.warn('REVISIUM_API_URL not configured, dictionary service disabled');
      return;
    }
    await this.authenticate();
  }

  private async authenticate() {
    const username = this.configService.get('REVISIUM_USERNAME') || 'admin';
    const password = this.configService.get('REVISIUM_PASSWORD') || 'admin';

    try {
      const response = await fetch(`${this.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${username}@example.com`, password }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        this.logger.error(`Dictionary auth failed: ${response.status}`);
        return;
      }

      const data = (await response.json()) as { accessToken: string };
      this.token = data.accessToken;
      this.logger.log('Dictionary service authenticated');
    } catch (error) {
      this.logger.error('Dictionary auth error', error instanceof Error ? error.message : error);
    }
  }

  async getRows(
    tableId: string,
    revisionId: string,
    opts: { first?: number; skip?: number } = {},
  ): Promise<unknown> {
    if (!this.apiUrl) return { edges: [] };

    const params = new URLSearchParams({ first: String(opts.first ?? DEFAULT_PAGE_SIZE) });
    if (opts.skip !== undefined) params.set('skip', String(opts.skip));

    try {
      const response = await fetch(
        `${this.apiUrl}/api/revision/${encodeURIComponent(revisionId)}/tables/${encodeURIComponent(tableId)}/rows?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );

      if (!response.ok) {
        this.logger.error(`Dictionary getRows failed: ${response.status}`);
        return { edges: [] };
      }

      return response.json();
    } catch (error) {
      this.logger.error('Dictionary getRows error', error instanceof Error ? error.message : error);
      return { edges: [] };
    }
  }

  async getRow(tableId: string, rowId: string, revisionId: string): Promise<unknown> {
    if (!this.apiUrl) return null;

    try {
      const response = await fetch(
        `${this.apiUrl}/api/revision/${encodeURIComponent(revisionId)}/tables/${encodeURIComponent(tableId)}/rows/${encodeURIComponent(rowId)}`,
        {
          headers: { Authorization: `Bearer ${this.token}` },
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );

      if (!response.ok) return null;

      return response.json();
    } catch (error) {
      this.logger.error('Dictionary getRow error', error instanceof Error ? error.message : error);
      return null;
    }
  }
}

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_TIMEOUT_MS = 5000;

function parseTimeoutMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
}
