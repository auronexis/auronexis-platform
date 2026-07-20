# Enterprise Deployment Guide

**Canonical** production deployment sequence for Auroranexis.  
**Billing:** Paddle only.  
**Related:** [enterprise-release-checklist.md](./enterprise-release-checklist.md) · [rollback-plan.md](./rollback-plan.md) · [disaster-recovery.md](./disaster-recovery.md) · [paddle-billing.md](./paddle-billing.md)

This document prepares and describes release steps. **Chapter 14 does not execute production deployment.**

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| Node.js 22+ / npm 10+ | Match CI |
| Supabase project | Migrations applied in timestamp order (67 files under `supabase/migrations/`) |
| Paddle Billing (live or sandbox) | Price IDs + webhook endpoint |
| Email provider | Resend (or configured SMTP/SES/Mailgun) |
| Optional AI | `OPENAI_API_KEY` + `AI_PROVIDER` — degrade gracefully if unset |
| Hosting | Vercel (see `vercel.json`) |

---

## 2. Environment validation

1. Copy `.env.example` → environment secrets store (never commit real values).
2. Confirm **required** keys from `auditProductionEnvironment()`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` — production HTTPS host (**no localhost**)
   - `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
   - `PADDLE_ENVIRONMENT=production` for live traffic
3. Confirm **recommended**:
   - `CRON_SECRET` (required for non-development cron auth)
   - Email provider credentials
   - Turnstile site + secret keys
4. Confirm **forbidden in production**:
   - `TURNSTILE_DISABLE`, `E2E_DISABLE_RATE_LIMIT`, `DEV_FORCE_PLAN` as live overrides
5. Run diagnostics / readiness panels after deploy (Settings → Diagnostics).

---

## 3. Pre-deploy pipeline (local / CI)

Execute in order — abort on failure:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:production-readiness
npm run test:enterprise-regression
npm run build
```

Optional authenticated browser smoke (requires credentials):

```bash
npm run test:e2e
```

CI workflow: `.github/workflows/ci.yml`.

---

## 4. Database release (never invent production downs)

1. Review pending files in `supabase/migrations/` ordered by timestamp.
2. Apply via Supabase CLI (`supabase db push`) or Dashboard migration history on the **target** project.
3. Prefer **forward-only** migrations. Rollback = application rollback + PITR / restore (see [rollback-plan.md](./rollback-plan.md)).
4. Verify RLS remains enabled on tenant tables.
5. **Do not** run production migrations from Chapter 14 automation.

### Manual intervention triggers

- Migrations that rewrite large tables or require downtime windows
- Any change touching billing entitlement tables during active checkout
- Index builds that may lock under load — schedule maintenance window

---

## 5. Application deploy sequence

1. Confirm staging green (same gates as §3).
2. Set production env vars in Vercel (Paddle **production** tokens).
3. Register Paddle webhook: `https://www.auroranexis.com/api/paddle/webhook` (or app host matching DNS).
4. Confirm Vercel Cron calls `POST /api/cron/run` with `Authorization: Bearer $CRON_SECRET` every **5 minutes** (`vercel.json`).
5. Promote deployment (Release chapter only).
6. Do **not** enable apex→`/api` redirects that break webhooks (`vercel.json` already excludes `api`).

---

## 6. Post-deploy validation

| Check | Expectation |
|-------|-------------|
| `GET /api/ready` | `200` + `ready: true` |
| `GET /api/health` | `healthy` or intentional `degraded` (AI optional) |
| Paddle webhook | Signature verify + idempotent event store |
| Cron | Authorized; `queue_worker` / `webhook_retries` execute |
| Auth | Login / logout / session refresh |
| Portal | Client portal login + report visibility |
| Billing | Checkout overlay / customer portal (Paddle customer) |
| SEO | `robots.txt` / sitemap public-only |
| Observability | Sentry/analytics consent-gated |

---

## 7. Asset & domain configuration

| Item | Production value |
|------|------------------|
| Marketing canonical | `https://www.auroranexis.com` |
| App | `https://app.auroranexis.com` (or configured `NEXT_PUBLIC_APP_URL`) |
| Apex | Redirect to www via `vercel.json` (API paths excluded) |
| Cookie / auth redirects | Match `NEXT_PUBLIC_APP_URL` + Supabase Auth allow-list |

See `src/lib/deployment/production-domains.ts`.

---

## 8. Feature / kill switches (safe defaults)

| Switch | Production rule |
|--------|-----------------|
| Plan entitlements | Source of truth — not ad-hoc flags |
| `AI_PROVIDER=disabled` | Safe AI kill-switch |
| `DEV_FORCE_PLAN` | Ignored when `NODE_ENV=production` |
| `BILLING_PROVIDER` | Abandoned — Paddle is always active |
| E2E bypass env vars | Never set on Vercel Production |

---

## 9. Background services

Registered jobs (`src/lib/jobs/registry.ts`): report schedules, SLA alerts, connector sync, billing snapshots, predictive refresh, automation maintenance, retention cleanup, **webhook_retries (*/5)**, **queue_worker (*/5)**.

Platform cron must invoke `/api/cron/run` at least every 5 minutes so due 5-minute jobs are not starved.

---

## 10. Rollback pointer

If post-deploy validation fails → [rollback-plan.md](./rollback-plan.md).
