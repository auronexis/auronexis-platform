# Stripe Idempotency Report — Phase 5 Sprint 0

**Date:** 2025-06-27  
**Sprint:** Phase 5 Sprint 0 — Production Infrastructure  
**Target:** v0.95 Pilot / Production Infrastructure Ready

---

## Summary

Stripe webhook idempotency is implemented end-to-end: a dedicated audit table, application-layer claim logic, webhook route integration, billing event deduplication at the database level, and diagnostics exposure in Settings. Duplicate Stripe deliveries are safely ignored; failed events can be retried without double-processing successful ones.

**Status:** Implemented and validated for pilot deployment.

---

## Implementation details

### Database migration

**File:** `supabase/migrations/20250624140000_production_infrastructure.sql`

**Table: `stripe_webhook_events`**

| Column | Purpose |
|--------|---------|
| `stripe_event_id` | Unique Stripe event ID (dedup key) |
| `event_type` | Stripe event type string |
| `status` | `processing` · `processed` · `failed` · `duplicate` |
| `organization_id` | Optional org scope for RLS |
| `retry_count` | Incremented on failure and Stripe retries |
| `error_message` | Truncated handler error (500 chars max) |
| `received_at` / `processed_at` / `last_attempt_at` | Audit timestamps |

**Indexes:**

- `idx_stripe_webhook_events_event_id` — UNIQUE on `stripe_event_id`
- `idx_stripe_webhook_events_status_received` — status + received_at for diagnostics queries

**Billing deduplication:**

- `idx_billing_events_stripe_event_unique` — partial UNIQUE on `billing_events.stripe_event_id` WHERE NOT NULL

**RLS:** Owner/admin SELECT when `organization_id` matches session; service role full access.

### Application layer

**File:** `src/lib/stripe/idempotency.ts`

| Function | Behavior |
|----------|----------|
| `isStripeEventProcessed(id)` | Returns true when status = `processed` |
| `markStripeEventProcessed(id, type, orgId?)` | Upserts processed row with timestamp |
| `markStripeEventFailed(id, type, message)` | Upserts failed row, increments retry_count |
| `ensureStripeIdempotency(event)` | Claims event before handler runs |
| `getStripeWebhookDiagnostics()` | Aggregates metrics for diagnostics panel |

**Idempotency state machine (`ensureStripeIdempotency`):**

| Existing status | Action | Result status |
|-----------------|--------|---------------|
| None | Insert `processing` | `proceed` |
| `processed` / `duplicate` | Update to `duplicate` | `duplicate` |
| `failed` | Update to `processing`, increment retry | `retry` |
| `processing` | No handler re-entry | `duplicate` |
| Insert race (23505) | Concurrent delivery | `duplicate` |
| Read error | Fail open to avoid blocking Stripe | `proceed` |

### Webhook route integration

**File:** `src/app/api/stripe/webhook/route.ts`

Processing order:

1. Verify `STRIPE_WEBHOOK_SECRET` and construct event from signature
2. `ensureStripeIdempotency(event)` — early return `{ duplicate: true }` if duplicate
3. `handleStripeWebhookEvent(event)` — business logic
4. `markStripeEventProcessed` on success
5. `markStripeEventFailed` on handler error → HTTP 500 (Stripe retries)

Response shapes:

- Success: `{ received: true, retried?: true }`
- Duplicate: `{ received: true, duplicate: true }`
- Error: `{ error: "<message>" }` with appropriate status code

---

## Validation steps

### Unit / integration checks

1. Apply migration; confirm table and indexes exist.
2. POST valid signed webhook → row with `status = 'processed'`.
3. Replay identical event ID → HTTP 200, `{ duplicate: true }`, status updated to `duplicate`.
4. Simulate handler failure → `status = 'failed'`, `retry_count` incremented.
5. Replay after failure → `status = 'processing'` then `processed` on success.

### SQL verification

```sql
SELECT status, COUNT(*) FROM stripe_webhook_events GROUP BY status;

SELECT stripe_event_id, event_type, status, retry_count, error_message
FROM stripe_webhook_events
ORDER BY received_at DESC LIMIT 10;
```

### Diagnostics verification

Settings → Diagnostics → **Stripe webhooks**:

- Events table reachable = true
- Processed events increments on first delivery
- Duplicates prevented increments on replay
- Failed events = 0 in healthy environment
- Last webhook received timestamp updates

---

## Pilot readiness notes

| Criterion | Status |
|-----------|--------|
| Duplicate delivery protection | ✅ Unique index + claim logic |
| Safe Stripe retry after failure | ✅ `failed` → `processing` → `processed` |
| Billing row deduplication | ✅ Partial unique on `billing_events` |
| Observability | ✅ Diagnostics section + SQL audit |
| RLS tenant isolation | ✅ Owner/admin scoped SELECT |
| Fail-open on read error | ⚠️ Documented tradeoff — logs error, proceeds |

**Production readiness contribution:** Stripe readiness sub-score in diagnostics (base 92 when platform Stripe health OK, −15 if failed events > 0).

**Remaining hardening (post-pilot):**

- Consider fail-closed on idempotency read errors in production (requires Stripe retry tolerance analysis)
- Add alerting on sustained `failed` event count
- Organization ID propagation to idempotency rows during webhook handling for per-org diagnostics

**Recommendation:** Approved for pilot. Stripe idempotency gap from v0.9 launch readiness report is closed.
