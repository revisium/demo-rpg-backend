import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import { PrismaService } from './prisma.service';

type TransactionClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

export interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  retry?: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

const DEFAULT_MAX_WAIT = 10000;
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_MAX_RETRIES = 20;
const DEFAULT_BASE_DELAY_MS = 30;
const DEFAULT_MAX_DELAY_MS = 1500;
const BACKOFF_BASE = 2;
const JITTER_FACTOR = 0.5;

interface SettingConfig {
  envKey: string;
  defaultValue: number;
  minValue: number;
  unit: string;
}

const SETTINGS_CONFIG: Record<string, SettingConfig> = {
  maxWait: {
    envKey: 'TRANSACTION_MAX_WAIT',
    defaultValue: DEFAULT_MAX_WAIT,
    minValue: 1,
    unit: 'ms',
  },
  timeout: {
    envKey: 'TRANSACTION_TIMEOUT',
    defaultValue: DEFAULT_TIMEOUT,
    minValue: 1,
    unit: 'ms',
  },
  maxRetries: {
    envKey: 'TRANSACTION_MAX_RETRIES',
    defaultValue: DEFAULT_MAX_RETRIES,
    minValue: 0,
    unit: '',
  },
  baseDelayMs: {
    envKey: 'TRANSACTION_BASE_DELAY_MS',
    defaultValue: DEFAULT_BASE_DELAY_MS,
    minValue: 0,
    unit: 'ms',
  },
  maxDelayMs: {
    envKey: 'TRANSACTION_MAX_DELAY_MS',
    defaultValue: DEFAULT_MAX_DELAY_MS,
    minValue: 0,
    unit: 'ms',
  },
};

@Injectable()
export class TransactionPrismaService implements OnModuleInit {
  private readonly logger = new Logger(TransactionPrismaService.name);
  private readonly options: Required<TransactionOptions>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.options = this.buildOptions();
  }

  onModuleInit() {
    this.logSettings();
  }

  async run<T>(fn: (prisma: TransactionClient) => Promise<T>): Promise<T> {
    return this.executeWithRetry(fn);
  }

  private async executeWithRetry<T>(fn: (prisma: TransactionClient) => Promise<T>): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs } = this.options.retry;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => fn(tx), {
          maxWait: this.options.maxWait,
          timeout: this.options.timeout,
          isolationLevel: 'Serializable',
        });
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryableError(lastError)) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);
          this.logger.debug(
            `Serialization failure (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.warn(`Transaction failed after ${maxRetries + 1} attempts`);
    throw lastError || new Error('Max retries exceeded for serializable transaction');
  }

  private isRetryableError(error: Error): boolean {
    const code = (error as { code?: string }).code || '';
    const retryableCodes = ['40001', '40P01', 'P2034', 'P2003'];

    if (retryableCodes.includes(code)) {
      return true;
    }

    const message = error.message || '';
    const retryablePatterns = [
      'could not serialize access',
      'deadlock detected',
      'TransactionWriteConflict',
      'Please retry your transaction',
    ];

    return retryablePatterns.some((pattern) => message.includes(pattern));
  }

  private calculateBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const exponentialDelay = baseDelayMs * Math.pow(BACKOFF_BASE, attempt);
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    const maxJitter = Math.floor(cappedDelay * JITTER_FACTOR);
    const jitter = maxJitter > 0 ? randomInt(maxJitter + 1) : 0;
    return cappedDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildOptions(): Required<TransactionOptions> {
    return {
      maxWait: this.getEnvNumber('maxWait'),
      timeout: this.getEnvNumber('timeout'),
      retry: {
        maxRetries: this.getEnvNumber('maxRetries'),
        baseDelayMs: this.getEnvNumber('baseDelayMs'),
        maxDelayMs: this.getEnvNumber('maxDelayMs'),
      },
    };
  }

  private getEnvNumber(settingName: string): number {
    const config = SETTINGS_CONFIG[settingName]!;
    const value = this.configService.get<string>(config.envKey);

    if (!value) return config.defaultValue;

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < config.minValue) {
      this.logger.warn(
        `Invalid ${config.envKey}: "${value}", using default ${config.defaultValue}`,
      );
      return config.defaultValue;
    }

    return parsed;
  }

  private logSettings() {
    const flat: Record<string, number> = {
      maxWait: this.options.maxWait,
      timeout: this.options.timeout,
      maxRetries: this.options.retry.maxRetries,
      baseDelayMs: this.options.retry.baseDelayMs,
      maxDelayMs: this.options.retry.maxDelayMs,
    };

    const settings = Object.entries(SETTINGS_CONFIG).map(([name, config]) => {
      const value = flat[name];
      return `${name}=${value}${config.unit}`;
    });

    this.logger.log(`Transaction settings: ${settings.join(', ')}`);
  }
}
