# Logging & Tracing

## Setup

Uses **Pino** via `nestjs-pino` with **CLS** (Continuation Local Storage) for trace ID propagation.

## Trace IDs

Every request gets a trace ID:
- From `X-Trace-ID` header (if provided)
- Auto-generated UUID (if not)

Trace ID is available in all logs within the request context.

## Log Levels

| Level | When to Use |
|---|---|
| `error` | Unrecoverable errors, exceptions |
| `warn` | Recoverable issues, deprecations |
| `info` | Business events, state changes |
| `debug` | Detailed diagnostic info |

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `LOG_LEVEL` | info | Minimum log level |
| `NODE_ENV` | - | If not `production`, uses `pino-pretty` |

## Usage in Services

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Operation started');
    this.logger.debug('Debug details');
    this.logger.error('Something failed', error.stack);
  }
}
```

## Production

In production (`NODE_ENV=production`), logs are output as structured JSON — ready for ELK, Datadog, or CloudWatch.
