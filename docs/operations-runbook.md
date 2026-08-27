# Operations Runbook

**Audience:** On-call engineers, platform operators
**Related:** [enterprise-deployment.md](./enterprise-deployment.md) · [enterprise-release-checklist.md](./enterprise-release-checklist.md) · [disaster-recovery.md](./disaster-recovery.md) · [rollback-plan.md](./rollback-plan.md) · [billing.md](./billing.md)

---

## Summary

Production operations span:

1. **Mollie webhooks** — classic payment notification, API re-fetch, idempotent reconcile (`/api/mollie/webhook`)
2. **Cron job dispatcher** — `/api/cron/run` executes registered background jobs
3. **Background queue** — durable jobs with retries, dead letters, and `queue_worker`

Diagnostics: Settings → Diagnostics and Billing → Diagnostics (owner/admin).

Legacy Stripe/Paddle/FastSpring are **not** active operations paths. `/api/fastspring/*` returns **410 Gone**.

---

## Key endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/mollie/webhook` | POST | Mollie classic payment id + API re-fetch | Subscription and billing sync |
| `/api/mollie/connectivity` | GET | Session / operator | Mollie API connectivity probe |
| `/api/cron/run` | GET | `Bearer CRON_SECRET` | Execute due cron jobs (Vercel Cron entrypoint) |
| `/api/cron/run` | POST | `Bearer CRON_SECRET` | Execute due cron jobs (manual ops) |
| `/api/cron/run?probe=1` | GET/POST | `Bearer CRON_SECRET` | List registered jobs (no execution) |
| `/api/cron/run?job=<id>` | GET/POST | `Bearer CRON_SECRET` | Force single job |
| `/api/health` | GET | Public (rate-limited) | Platform health snapshot |
| `/api/ready` | GET | Public | Readiness probe |
| `/api/fastspring/webhook` | POST | N/A | **410 Gone** — retired |

**Development note:** When `CRON_SECRET` is unset and `NODE_ENV=development`, cron auth is bypassed. Production must set `CRON_SECRET` (fail closed).

---

## Environment variables (ops-critical)

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | Production | Bearer for cron |
| `MOLLIE_API_KEY` | Yes | Server-only (`test_` or `live_`) |
| `MOLLIE_BILLING_ROLLOUT` | Production | Master switch for NEW Mollie checkout |
| `MOLLIE_LIVE_CHARGING_ENABLED` | Production | Must be `false` in SAFE CONTROLLED PRODUCTION MODE |
| `MOLLIE_BILLING_ORG_ALLOWLIST` | Optional | Comma-separated org UUIDs |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Jobs, queue, admin paths |
| `NEXT_PUBLIC_APP_URL` | Yes | No localhost in production |

---

## Incident playbooks

### Mollie webhook failures

1. Check Vercel logs for `/api/mollie/webhook`.
2. Confirm `NEXT_PUBLIC_APP_URL=https://app.auroranexis.com` so new payment/subscription creates supply the correct per-resource `webhookUrl` (`buildMollieWebhookUrl()`). Dashboard webhook registration is **not** required; do **not** configure Next-Gen Dashboard webhooks against the classic endpoint.
3. Confirm API key mode matches intent (`test_` vs `live_`).
4. If `live_` key and LIVE charging disabled → expect **503** (fail-closed by design).
5. Confirm idempotency store healthy (`mollie_webhook_events`).
6. If poison deploy → [rollback-plan.md](./rollback-plan.md) §5.

### Cron / queue stalled

1. `GET /api/cron/run?probe=1` with bearer — list jobs.
2. Confirm Vercel cron schedule is `*/5 * * * *`.
3. Force `queue_worker` or `webhook_retries` if due work is backed up.
4. Inspect dead letters before mass replay.

### Auth / session outage

1. Verify Supabase status + Auth redirect URLs.
2. Confirm `NEXT_PUBLIC_APP_URL` matches live host.
3. Do not disable RLS.

### AI provider outage

1. Set `AI_PROVIDER=disabled` if errors cascade.
2. Confirm degraded health is acceptable; ready probe still green.

---

## Monitoring

- Uptime: `/api/ready` and `/api/health`
- Errors: Sentry (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`)
- Product analytics: consent-gated sinks only (PostHog EU)
- Billing: Settings → Billing → Diagnostics

Health JSON includes `configuration.mollie` (Mollie configured). Legacy `configuration.fastspring` / `configuration.paddle` / `configuration.stripe` mirror the same boolean for older monitors — they do **not** mean those providers are active.

---

## Escalation

1. Apply [rollback-plan.md](./rollback-plan.md) decision tree.
2. Tier 2+ → [disaster-recovery.md](./disaster-recovery.md).
3. Record SHA, deployment URL, and timestamps in the incident note.
