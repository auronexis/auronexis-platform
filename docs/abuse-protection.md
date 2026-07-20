# Abuse Protection

**Target:** No unrestricted public endpoint  
**Billing webhooks:** Paddle signature verification + idempotency (`/api/paddle/webhook`)

---

## Summary

| Control | Status | Notes |
|---------|--------|-------|
| Spam protection | **PASS** | Turnstile on login, signup, contact, support |
| Flood protection | **PASS** | Sliding-window rate limits on auth and forms |
| Burst traffic handling | **PASS** | 429 responses with `Retry-After` |
| Webhook abuse prevention | **PASS** | Paddle signature + idempotency store |

## Public / sensitive endpoints

| Endpoint | Protection |
|----------|------------|
| `/api/paddle/webhook` | Paddle signature + provider/event idempotency |
| `/api/cron/run` | Bearer `CRON_SECRET` (fail-closed outside development) |
| Auth / contact / support forms | Turnstile + rate limits |

## Operator notes

- Never set `TURNSTILE_DISABLE` or `E2E_DISABLE_RATE_LIMIT` in production
- Replay Paddle events only after handler health is confirmed
- See [operations-runbook.md](./operations-runbook.md) and [paddle-billing.md](./paddle-billing.md)

Historical Stripe webhook docs are obsolete — do not register `/api/stripe/webhook`.
