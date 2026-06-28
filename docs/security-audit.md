# Security Audit — Sprint 10

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Scope:** RLS, secrets, OAuth, webhooks, API keys, connectors, audit immutability

## Summary matrix

| Area | Verdict | Critical |
|------|---------|----------|
| RLS policies | **PASS** | No |
| Secrets vault | **PASS** | No |
| OAuth state | **PASS** | No |
| Webhook verification | **WARN** | No |
| API keys & rate limits | **PASS** | No |
| Connector isolation | **PASS** | No |
| Audit immutability | **PASS** | No |
| Tenant isolation | **PASS** | No |

**Overall:** Strong org-scoped RLS and server-side secret handling. Pilot-safe with documented hardening items for production scale.

---

## RLS policies

### PASS
- **51/51** public tables enable RLS across 30 migrations
- Consistent `current_organization_id()` isolation
- Role gates: owner/admin/staff/viewer per module
- Portal-scoped client read policies
- Storage bucket `white-label-assets` scoped by org folder
- Append-only tables (`ai_usage_events`, `api_request_logs`, `billing_events`, `data_access_logs`) — SELECT only for authenticated

### WARN
- `discount_codes` globally readable by any authenticated user (intentional promos)
- `integration_sync_jobs` has no DELETE policy for authenticated users

---

## Secrets vault

### PASS
- AES-256-GCM encryption (`src/lib/integrations/secrets/encryption.ts`)
- Ciphertext-only in DB (`integration_secrets.encrypted_value`)
- Production gate blocks creation without key
- OAuth tokens and webhook secrets use same vault
- Decrypt paths org-scoped in repository

### WARN
- Env var is **`INTEGRATION_SECRET_KEY`** (singular) — document correctly in ops runbooks
- No automatic rotation job (manual rotate action exists)

---

## OAuth state handling

### PASS
- Authorize route: session + RBAC + `createOAuthState()` with org, connector, redirect, scopes, PKCE
- Callback: `consumeOAuthState()`, `validateOAuthState()`, org match before token exchange
- 10-minute TTL, single-use via `consumed_at`
- RLS on `integration_oauth_states`

### WARN
- State consume is SELECT then UPDATE (race window)
- Callback does not re-validate redirect URI against request path

---

## Webhook verification

### Stripe (inbound) — PASS
- `stripe-signature` required
- `constructEvent()` verification in `/api/stripe/webhook`
- Returns 400 on invalid signature

### WARN
- No idempotency on `billing_events.stripe_event_id` (not UNIQUE)

### Connector inbound — WARN
- Connector `webhook.ts` validators are stubs (`return Boolean(_signature)`)
- No inbound connector webhook API routes yet

### Outbound platform webhooks — PASS
- HMAC signing in dispatcher
- `verifyWebhookSignature()` with timing-safe compare + timestamp tolerance

---

## API keys

### PASS
- 16 defined scopes with per-route enforcement via `withApiHandler`
- SHA-256 hashed keys; prefix `anx_live_`
- Constant-time hash compare
- Revoked keys rejected
- Plan feature gate `future_api_webhooks`

### WARN
- `assertScopeMatchesRbac()` defined but unused
- Rate limit store is in-memory `Map` — not shared across serverless instances

---

## Rate limiting

### PASS
- Per-key sliding 60s window by plan tier (30–300 req/min)
- 429 responses with `X-RateLimit-*` headers
- Separate integration org-scoped limits

### WARN
- Horizontal scaling requires Redis/KV-backed limiter

---

## Connector isolation

### PASS
- All connector tables org-scoped with RLS
- Queries filter by session org in `connectors/queries.ts`
- Token load/revoke requires org + connection match
- OAuth callback binds to session org

---

## Audit immutability

### PASS
- `audit_events`: authenticated SELECT only (owner/admin)
- Inserts via service role (`recordAuditEvent`)
- No application delete paths
- Retention simulation-only (no auto-delete)

### WARN
- `service_role` retains DELETE grant — no DB trigger preventing delete
- Consider `REVOKE DELETE` for defense-in-depth

---

## Pre-production hardening checklist

- [ ] Add Stripe webhook idempotency (`UNIQUE(stripe_event_id)`)
- [ ] Atomic OAuth state consumption
- [ ] Distributed API rate limiter
- [ ] Real HMAC on connector inbound webhooks (when routes added)
- [ ] Document `INTEGRATION_SECRET_KEY` in deployment secrets

## Related

- [security.md](./security.md)
- [secrets.md](./secrets.md)
- [release-checklist.md](./release-checklist.md)
