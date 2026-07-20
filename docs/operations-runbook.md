# Operations Runbook

**Audience:** On-call engineers, platform operators  
**Related:** [enterprise-deployment.md](./enterprise-deployment.md) · [enterprise-release-checklist.md](./enterprise-release-checklist.md) · [disaster-recovery.md](./disaster-recovery.md) · [rollback-plan.md](./rollback-plan.md) · [paddle-billing.md](./paddle-billing.md)

---

## Summary

Production operations span:

1. **Paddle webhooks** — signature verification + idempotent commercial event processing (`/api/paddle/webhook`)
2. **Cron job dispatcher** — `/api/cron/run` executes registered background jobs
3. **Background queue** — durable jobs with retries, dead letters, and `queue_worker`

Diagnostics: Settings → Diagnostics and Billing → Diagnostics (owner/admin).

---

## Key endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/paddle/webhook` | POST | Paddle signature | Subscription and billing sync |
| `/api/cron/run` | POST | `Bearer CRON_SECRET` | Execute due cron jobs |
| `/api/cron/run` | GET | `Bearer CRON_SECRET` | List registered jobs |
| `/api/cron/run?job=<id>` | POST | `Bearer CRON_SECRET` | Force single job |
| `/api/health` | GET | Public (rate-limited) | Platform health snapshot |
| `/api/ready` | GET | Public | Readiness probe |

**Development note:** When `CRON_SECRET` is unset and `NODE_ENV=development`, cron auth is bypassed. Production must set `CRON_SECRET` (fail closed).

---

## Environment variables (ops-critical)

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | Production | Bearer for cron |
| `PADDLE_API_KEY` | Yes | Server-only |
| `PADDLE_WEBHOOK_SECRET` | Yes | Signature verification |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Yes | Checkout |
| `PADDLE_ENVIRONMENT` | Yes | `sandbox` \| `production` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Jobs, queue, admin paths |
| `NEXT_PUBLIC_APP_URL` | Yes | No localhost in production |

---

## Incident playbooks

### Paddle webhook failures

1. Check Vercel logs for `/api/paddle/webhook`.
2. Confirm secret matches Paddle notification destination.
3. Confirm idempotency store healthy (no fail-open on store errors).
4. Replay events from Paddle after fix.
5. If poison deploy → [rollback-plan.md](./rollback-plan.md) §5.

### Cron / queue stalled

1. `GET /api/cron/run` with bearer — list jobs.
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
- Product analytics: consent-gated sinks only
- Billing: Settings → Billing → Diagnostics

Health JSON includes `configuration.paddle` (Paddle configured). Legacy `configuration.stripe` mirrors the same boolean for older monitors.

---

## Escalation

1. Apply [rollback-plan.md](./rollback-plan.md) decision tree.
2. Tier 2+ → [disaster-recovery.md](./disaster-recovery.md).
3. Record SHA, deployment URL, and timestamps in the incident note.
