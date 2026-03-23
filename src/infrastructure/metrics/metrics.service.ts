import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  public readonly registry = new Registry();

  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly graphqlOperationsTotal: Counter;
  public readonly graphqlOperationDuration: Histogram;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry],
    });

    this.graphqlOperationsTotal = new Counter({
      name: 'graphql_operations_total',
      help: 'Total GraphQL operations',
      labelNames: ['operation', 'operationName'],
      registers: [this.registry],
    });

    this.graphqlOperationDuration = new Histogram({
      name: 'graphql_operation_duration_seconds',
      help: 'GraphQL operation duration in seconds',
      labelNames: ['operation', 'operationName'],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    if (process.env['METRICS_ENABLED'] === 'true') {
      collectDefaultMetrics({ register: this.registry });
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
