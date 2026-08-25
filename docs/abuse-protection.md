# Abuse Protection

**Target:** No unrestricted public endpoint
**Billing webhooks:** Mollie classic payment notification + API re-fetch + idempotency (`/api/mollie/webhook`)

---

## Summary

| Control | Status | Notes |
|---------|--------|-------|
| Spam protection | **PASS** | Turnstile on login, signup, contact, support |
| Flood protection | **PASS** | Sliding-window rate limits on auth and forms |
| Burst traffic handling | **PASS** | 429 responses with `Retry-After` |
| Webhook abuse prevention | **PASS** | Mollie payment id + API re-fetch + `mollie_webhook_events` idempotency |

## Public / sensitive endpoints

| Endpoint | Protection |
|----------|------------|
| `/api/mollie/webhook` | Classic payment id extract + Mollie API re-fetch + idempotency ledger |
| `/api/cron/run` | Bearer `CRON_SECRET` (fail-closed outside development) |
| `/api/fastspring/webhook` | **410 Gone** — retired; do not register |
| Auth / contact / support forms | Turnstile + rate limits |

## Operator notes

- Never set `TURNSTILE_DISABLE` or `E2E_DISABLE_RATE_LIMIT` in production
- Retry Mollie payment notifications only after handler health is confirmed
- Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` unless LIVE charging is explicitly approved
- See [operations-runbook.md](./operations-runbook.md) and [billing.md](./billing.md)

Historical Stripe/Paddle/FastSpring webhook docs are obsolete — do not register retired provider webhook routes for active billing.
