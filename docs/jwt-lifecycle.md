# JWT Token Lifecycle

## Overview

Two-token system with httpOnly cookie storage for browser clients. Bearer header auth (MCP, OAuth, API keys) continues to work unchanged.

| Token | Type | Lifetime | Storage | Cookie |
|-------|------|----------|---------|--------|
| Access Token | JWT (signed) | 30 minutes | httpOnly cookie | `rev_at` |
| Refresh Token | Opaque (`ref_`) | 7 days | SHA-256 hash in DB + httpOnly cookie | `rev_rt` |

## Dual Auth: Cookies + Bearer

```
Request arrives
  │
  ├─ Has Authorization: Bearer? → use it (MCP, OAuth, PAT)
  │
  └─ No? → check cookie rev_at (admin UI / browser)
```

Bearer header always takes priority. MCP/OAuth tokens are unaffected.

## Database Model

### RefreshToken table (`refresh_tokens`)

```
RefreshToken
├── id          String    @id
├── tokenHash   String    @unique   (SHA-256 of ref_xxx)
├── userId      String              (FK → User)
├── familyId    String              (groups tokens for reuse detection)
├── expiresAt   DateTime            (absolute: 7 days from creation)
├── revokedAt   DateTime?           (null = active, set on rotation/revoke)
└── createdAt   DateTime
```

### User.tokenVersion

```
User
├── ...existing fields
└── tokenVersion  Int  @default(0)  (increment to revoke all JWTs)
```

JWT payload includes `ver` claim. On validation: `payload.ver !== user.tokenVersion` → token revoked.

## Token Versioning

`User.tokenVersion` enables instant revocation without a blocklist:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: { tokenVersion: { increment: 1 } },
});
```

All existing JWTs for this user become invalid (version mismatch).

## Cookie Settings

| Property | `rev_at` (access) | `rev_rt` (refresh) |
|----------|-------------------|---------------------|
| `httpOnly` | true | true |
| `secure` | prod only | prod only |
| `sameSite` | `lax` | `lax` |
| `path` | `/` | `/api/auth/refresh` |
| `maxAge` | 30 min | 7 days |

## API Endpoints

### Login

```
POST /api/auth/login
{ "email": "admin@example.com", "password": "..." }

Response:
Set-Cookie: rev_at=<jwt>; HttpOnly; SameSite=Lax; Path=/
Set-Cookie: rev_rt=ref_...; HttpOnly; SameSite=Lax; Path=/api/auth/refresh
{ "expiresIn": 1800, "tokenType": "cookie" }
```

### Refresh

```
POST /api/auth/refresh
Cookie: rev_rt=ref_...

Response:
Set-Cookie: rev_at=<new_jwt>; rev_rt=<new_ref>
{ "expiresIn": 1800, "tokenType": "cookie" }
```

Both tokens are rotated. Previous refresh token is revoked.

### Logout

```
POST /api/auth/logout
Cookie: rev_at=...; rev_rt=...

Response: 204 No Content
(cookies cleared, token family revoked)
```

## Refresh Token Rotation

```
Login → T1 (familyId: "fam_abc")
  ├─ Refresh T1 → T2 (T1 revoked)
  │   ├─ Refresh T2 → T3 (T2 revoked)
  │   └─ T2 reused → REUSE DETECTED → T3 revoked
  └─ T1 reused → REUSE DETECTED → entire family revoked
```

## Grace Period (Multi-Tab Safety)

Multiple tabs share cookies. If two tabs refresh simultaneously:

```
Tab A: refresh(T1) → T2 created, T1 revoked
Tab B: refresh(T1) → T1 revoked, BUT within 30s grace
        → find latest active (T2) → rotate → T3
```

After 30s, reuse triggers full family revocation (theft detection).

## Reuse Detection

If a **revoked** refresh token is presented outside the grace period, the entire token family is revoked:

```
Attacker steals T1
├─ User refreshes T1 → T2 (T1 revoked)
└─ Attacker tries T1 → revokedAt > 30s ago
   → REUSE DETECTED → T2 also revoked
   → User must re-login
```

This follows Auth0 ("Rotation Overlap Period") and Okta ("Grace Period") patterns.

## Frontend Integration

### Key Principle: No Tokens in JavaScript

Tokens live in httpOnly cookies — JavaScript cannot read or set them. The browser handles cookie transport automatically.

### What Frontend Does NOT Do

- No `localStorage.setItem('token', ...)`
- No `Authorization: Bearer` header for browser requests
- No token state in MobX/Redux/state management
- No manual cookie reading

### What Frontend DOES Do

1. Add `credentials: 'same-origin'` to all fetch/GraphQL calls
2. Schedule proactive refresh before access token expires
3. Handle 401 responses with retry after refresh
4. Coordinate refresh across tabs via BroadcastChannel

### GraphQL Client Setup

```typescript
const client = new GraphQLClient('/graphql', {
  credentials: 'same-origin',
});
```

All requests automatically include cookies. No manual headers needed.

### REST Client Setup

```typescript
fetch('/api/tasks', {
  credentials: 'same-origin',
});
```

### Login Flow

```typescript
const res = await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { expiresIn } = await res.json();
scheduleRefresh(expiresIn);
await fetchMe();
```

Backend sets cookies via `Set-Cookie` header. Response body contains only `expiresIn`.

### Proactive Refresh

```typescript
function scheduleRefresh(expiresIn: number) {
  const BUFFER_SECONDS = 120;
  const delay = (expiresIn - BUFFER_SECONDS) * 1000;

  setTimeout(async () => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (res.ok) {
      const { expiresIn: newExpiresIn } = await res.json();
      scheduleRefresh(newExpiresIn);
    } else {
      redirectToLogin();
    }
  }, delay);
}
```

### Page Refresh

On page reload, cookies are still in the browser. Frontend initializes by calling `/api/auth/me`:

```typescript
async function initialize() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (res.ok) {
    const user = await res.json();
    setCurrentUser(user);
  } else {
    redirectToLogin();
  }
}
```

If `rev_at` cookie expired during page close, `/api/auth/me` returns 401. Frontend then tries refresh:

```typescript
async function initialize() {
  let res = await fetch('/api/auth/me', { credentials: 'same-origin' });

  if (res.status === 401) {
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });

    if (refreshRes.ok) {
      const { expiresIn } = await refreshRes.json();
      scheduleRefresh(expiresIn);
      res = await fetch('/api/auth/me', { credentials: 'same-origin' });
    }
  }

  if (res.ok) {
    setCurrentUser(await res.json());
  } else {
    redirectToLogin();
  }
}
```

### 401 Retry (Reactive Refresh)

Wrap API calls to automatically retry on 401:

```typescript
async function apiCall(url: string, options: RequestInit = {}) {
  let res = await fetch(url, { ...options, credentials: 'same-origin' });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(url, { ...options, credentials: 'same-origin' });
    } else {
      redirectToLogin();
    }
  }

  return res;
}
```

### Logout

```typescript
async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'same-origin',
  });
  broadcastChannel.postMessage({ type: 'logout' });
  redirectToLogin();
}
```

Backend clears cookies and revokes token family. Frontend redirects to login.

### Multi-Tab Coordination (BroadcastChannel)

Multiple tabs share cookies but run independent JavaScript. Use `BroadcastChannel` to coordinate:

```typescript
const channel = new BroadcastChannel('app_auth');

channel.onmessage = (event) => {
  switch (event.data.type) {
    case 'refresh_done':
      scheduleRefresh(event.data.expiresIn);
      break;
    case 'logout':
      redirectToLogin();
      break;
  }
};
```

| Scenario | What Happens |
|---|---|
| Tab A refreshes | Broadcasts `refresh_done` → other tabs reschedule timers |
| Tab A logs out | Broadcasts `logout` → all tabs redirect to login |
| Two tabs refresh simultaneously | Grace period (30s) handles backend race condition |
| Page closed for 5 min, reopened | `rev_at` expired → `initialize()` calls refresh → new cookies |
| Page closed for 8 days, reopened | `rev_rt` expired → refresh fails → redirect to login |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (required) | JWT signing secret |
| `JWT_REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh token absolute expiry |
| `JWT_REFRESH_GRACE_PERIOD_MS` | `30000` | Grace period for multi-tab (0 = disabled) |
| `COOKIE_SECURE` | auto | Cookie Secure flag (auto = based on NODE_ENV) |

## Local Development with Frontend

Use Vite proxy so frontend and backend appear same-origin — cookies work without HTTPS:

```typescript
// vite.config.ts (frontend)
export default {
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
      '/graphql': 'http://localhost:8080',
    },
  },
};
```

| Component | URL | Cookies |
|---|---|---|
| Frontend | `http://localhost:3000` | Set via proxy (same-origin) |
| Backend | `http://localhost:8080` | Sets `rev_at`, `rev_rt` |
| Proxy | Vite forwards `/api/*`, `/graphql` | Transparent |

No CORS issues. No `SameSite=None`. No HTTPS required.

## Testing Locally (curl)

```bash
# Login and get cookies
curl -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}' \
  -c cookies.txt

# Use cookie for authenticated requests
curl http://localhost:8080/api/auth/me -b cookies.txt

# Refresh tokens
curl -X POST http://localhost:8080/api/auth/refresh -b cookies.txt -c cookies.txt

# Logout
curl -X POST http://localhost:8080/api/auth/logout -b cookies.txt -c cookies.txt

# Bearer header still works (MCP, testing)
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <jwt-token>"
```

## Architecture Reference

Based on [ADR-0040: JWT Token Lifecycle](https://github.com/revisium/revisium/blob/master/architecture/adr/ADR-0040-jwt-token-lifecycle.md) and [jwt-refresh-v1.spec.md](https://github.com/revisium/revisium/blob/master/architecture/specs/jwt-refresh-v1.spec.md).
