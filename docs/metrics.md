# Metrics

## Setup

Uses **Prometheus** (`prom-client`) for application metrics.

- Endpoint: `GET /metrics`
- Enabled by: `METRICS_ENABLED=true`

## Built-in Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | method, path, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, path, status | Request duration |
| `graphql_operations_total` | Counter | operation, operationName | Total GraphQL operations |
| `graphql_operation_duration_seconds` | Histogram | operation, operationName | GraphQL operation duration |
| Default Node.js metrics | Various | - | Memory, CPU, event loop, GC |

## Adding Custom Metrics

```typescript
import { MetricsService } from 'src/infrastructure/metrics/metrics.service';

@Injectable()
export class MyService {
  private readonly myCounter: Counter;

  constructor(private readonly metrics: MetricsService) {
    this.myCounter = new Counter({
      name: 'my_custom_counter',
      help: 'My custom counter',
      registers: [metrics.registry],
    });
  }
}
```

## Kubernetes Integration

Add to your pod spec:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```
