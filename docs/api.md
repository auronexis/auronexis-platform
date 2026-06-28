# Auroranexis Public API

Phase 4 Sprint 6 exposes Auroranexis capabilities through a secure, versioned Public API for customers, partners, and third-party developers. The API layer wraps existing domain logic without modifying business rules.

## Architecture

```
Client (Bearer API Key)
        ↓
/api/v1/*  →  withApiHandler (auth, scopes, rate limit, audit log)
        ↓
Existing lib/* queries & repositories (SessionContext from API key)
        ↓
Supabase (organization isolation + RLS on dashboard paths)
```

Future versions mount at `/api/v2/*` without breaking `/api/v1/*` clients.

## Authentication

Send API keys in the `Authorization` header:

```http
Authorization: Bearer anx_live_...
```

Key types:

| Type | Use |
|------|-----|
| Personal | Bound to the creating user’s RBAC role |
| Workspace | Organization-wide key (admin-equivalent, scope-limited) |

Keys are stored as SHA-256 hashes only. Plaintext is shown once at creation in **Settings → Public API**.

Enterprise plan (`future_api_webhooks`) is required.

## Scopes

Granular scopes integrate with existing RBAC:

- `clients.read` / `clients.write`
- `reports.read` / `reports.write`
- `risks.read` / `risks.write`
- `incidents.read` / `incidents.write`
- `automation.read` / `automation.write`
- `integrations.read` / `integrations.write`
- `predictive.read`
- `ai.execute`
- `billing.read`
- `settings.read`

Each route checks required scopes before executing handlers.

## Pagination

List endpoints support cursor pagination:

```http
GET /api/v1/clients?limit=25&cursor=...
```

Response:

```json
{
  "data": [],
  "nextCursor": "...",
  "hasMore": true
}
```

## Filtering & sorting

Query parameters:

- `status`, `client`, `owner`, `severity`, `priority`
- `created_after`, `created_before`, `updated_after`, `updated_before`
- `sort=asc|desc`

## Rate limits

Per API key, per minute, by organization plan:

| Plan | Limit |
|------|-------|
| Starter | 30 |
| Professional | 60 |
| Business | 120 |
| Enterprise | 300 |

Headers on success:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-API-Version`

On limit exceeded: `429 Too Many Requests` with `Retry-After`.

## REST resources (v1)

| Resource | Methods |
|----------|---------|
| `/api/v1/clients` | GET, POST |
| `/api/v1/clients/{id}` | GET, PATCH, DELETE |
| `/api/v1/reports` | GET |
| `/api/v1/reports/{id}` | GET |
| `/api/v1/risks` | GET |
| `/api/v1/risks/{id}` | GET |
| `/api/v1/incidents` | GET |
| `/api/v1/incidents/{id}` | GET |
| `/api/v1/automation` | GET |
| `/api/v1/automation/{id}` | GET |
| `/api/v1/predictive` | GET |
| `/api/v1/ai` | POST |
| `/api/v1/integrations` | GET |

## Webhooks

Outbound webhooks deliver signed events to registered HTTPS endpoints.

Events:

- `client.created`
- `report.published`
- `risk.created`
- `incident.created`
- `automation.executed`
- `ai.generated`

Headers:

- `X-Auroranexis-Signature`
- `X-Auroranexis-Timestamp`
- `X-Auroranexis-Event`

Verify signatures with constant-time comparison. Delivery logs and retries are stored in `api_webhook_deliveries`.

## OpenAPI

Interactive documentation: [`/api/docs`](/api/docs)

## Dashboard

**Settings → Public API** (`/settings/api`) — owner/admin only:

- Create/revoke API keys
- Scope assignment
- Usage metrics
- Webhook endpoints and recent deliveries

## Security

- Hashed API keys with constant-time comparison
- Organization isolation on every query
- No secrets, stack traces, or internal tokens in responses
- Request audit logging in `api_request_logs`
- Activity events for mutating API operations

## Extension guide

1. Add scope to `ALL_API_SCOPES` in `src/lib/api/types.ts`
2. Map scope to RBAC in `src/lib/api/auth/context.ts`
3. Create handler under `src/app/api/v1/{resource}/route.ts`
4. Reuse existing `src/lib/{domain}/queries.ts` via `apiContextToSession()`
5. Update `buildOpenApiSpec()` in `src/lib/api/openapi/spec.ts`
