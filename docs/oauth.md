# OAuth Server

## Purpose

OAuth server provides authentication for MCP clients (Claude Code, Cursor, etc.) using the standard OAuth 2.0 authorization code flow with PKCE.

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/.well-known/oauth-authorization-server` | GET | Server metadata |
| `/.well-known/oauth-protected-resource` | GET | Resource metadata |
| `/oauth/register` | POST | Dynamic client registration |
| `/oauth/authorize` | GET | Redirect to authorization UI |
| `/oauth/authorize` | POST | Issue authorization code |
| `/oauth/token` | POST | Exchange code/refresh for tokens |
| `/oauth/revoke` | POST | Revoke tokens |

## PKCE Flow

```
1. Client → GET /oauth/authorize?client_id=...&redirect_uri=...&code_challenge=...&code_challenge_method=S256&response_type=code
2. Server → Redirect to authorization UI
3. User approves → POST /oauth/authorize (with Bearer JWT)
4. Server → Returns redirect_uri with authorization code
5. Client → POST /oauth/token (grant_type=authorization_code&code=...&code_verifier=...&redirect_uri=...&client_secret=...)
6. Server → Returns access_token (oat_) + refresh_token (ort_)
```

## Token Types

| Prefix | Type | Default Expiry |
|---|---|---|
| `oat_` | Access token | 1h (30d for MCP scope) |
| `ort_` | Refresh token | 30d (90d for MCP scope) |
| `ocs_` | Client secret | No expiry |
| `auth_` | Authorization code | 10 minutes |

## Security

- All tokens stored as SHA-256 hashes (never plain text)
- PKCE S256 method only
- Timing-safe comparisons for all secret validation
- Authorization codes are one-time use
- Revoking refresh token cascades to access tokens

## Configuration

| Env Variable | Default | Description |
|---|---|---|
| `MCP_ACCESS_TOKEN_EXPIRY_DAYS` | 30 | Access token expiry for MCP scope |
| `PUBLIC_URL` | http://localhost:8080 | Used in .well-known metadata |
