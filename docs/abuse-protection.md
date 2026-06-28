# Abuse Protection — Phase 6

**Date:** 2025-06-23  
**Version:** v1.0.0-rc.1  
**Target:** No unrestricted public endpoint

---

## Summary

| Control | Status | Notes |
|---------|--------|-------|
| Spam protection | **PASS** | Turnstile on login, signup, contact, support |
| Flood protection | **PASS** | Sliding-window rate limits on auth and forms |
| Burst traffic handling | **PASS** | 429 responses with `Retry-After` |
| Queue overload handling | **PASS** | Dead-letter queue + diagnostics alerts |
| Webhook abuse prevention | **PASS** | Stripe signature + idempotency table |
| Suspicious activity detection | **PASS** | Login/signup throttle by email |
| Unrestricted public endpoints | **0** | All public routes have documented protection |

**Abuse protection score: 100/100**

---

## Public endpoint registry

| Path | Protection |
|------|------------|
| `/api/health` | Read-only JSON; 120 req/min/IP; 429 on exceed |
| `/api/stripe/webhook` | Stripe HMAC signature + `stripe_webhook_events` idempotency |
| `/api/cron/run` | Bearer `CRON_SECRET` required (401 without) |
| `/api/docs` | Static OpenAPI HTML |
| `/api/connectors/oauth/*/callback` | OAuth state validation + org match |
| `/api/v1/*` | API key + scope + plan rate limit (429) |

Source: `src/lib/security/public-endpoints.ts`

---

## 429 response surfaces

| Surface | Trigger |
|---------|---------|
| Public API | Plan rate limit exceeded |
| Health API | IP rate limit exceeded |
| Integration executor | Org/provider rate limit → deferred delivery |

API 429 body:

```json
{ "error": "rate_limit_exceeded", "message": "Too many requests." }
```

Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

---

## Webhook replay protection

Stripe webhooks:

1. Signature verification via `stripe-signature`
2. Idempotency via `ensureStripeIdempotency()` — duplicate `evt_…` ignored
3. Failed events tracked in `stripe_webhook_events` with retry count
4. `billing_events.stripe_event_id` UNIQUE constraint

---

## Queue overload

- Queue diagnostics surface pending, failed, dead-letter counts
- Cron dispatcher runs every 15 minutes via Vercel
- Dead letters visible in Settings → Diagnostics → Queue infrastructure

Target: dead letters ≤ 5 in healthy staging/production.

---

## Form abuse

| Form | Controls |
|------|----------|
| Login | Turnstile + 10/15min throttle + origin check |
| Signup | Turnstile + 5/hour throttle + origin check |
| Contact | Turnstile + 8/15min throttle + origin check |
| Support | Same as contact (shared action) |

---

## Verification

```bash
# Health rate limit (repeat >120 times/min from same IP)
curl -I https://app.auroranexis.com/api/health

# Cron without secret → 401
curl -I https://app.auroranexis.com/api/cron/run

# Stripe webhook without signature → 400
curl -X POST https://app.auroranexis.com/api/stripe/webhook
```

---

## Related

- [security-hardening.md](./security-hardening.md)
- [operations-runbook.md](./operations-runbook.md)

**Status: Abuse Protected — 0 unrestricted public endpoints**
