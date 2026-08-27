# Enterprise Deployment Guide

**Canonical** production deployment sequence for Auroranexis.
**Billing:** Mollie only (sole active checkout/billing provider). Auroranexis remains the seller; Mollie is the PSP. Legacy Stripe/Paddle/FastSpring data is archive-only.
**Production mode:** SAFE CONTROLLED PRODUCTION MODE — `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE approval (P1-002).
**Related:** [enterprise-release-checklist.md](./enterprise-release-checklist.md) · [rollback-plan.md](./rollback-plan.md) · [disaster-recovery.md](./disaster-recovery.md) · [billing.md](./billing.md) · Historical: [paddle-billing.md](./paddle-billing.md)

This document prepares and describes release steps. **Chapter 14 does not execute production deployment.**

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| Node.js 22+ / npm 10+ | Match CI |
| Supabase project | Migrations applied in timestamp order under `supabase/migrations/` |
| Mollie Billing | API key + classic handler `/api/mollie/webhook` (per-resource `webhookUrl`; Dashboard registration **not** required) |
| Email provider | SMTP (production path) or configured provider |
| Optional AI | `OPENAI_API_KEY` + `AI_PROVIDER` — degrade gracefully if unset |
| Hosting | Vercel (see `vercel.json`) |

---

## 2. Environment validation

1. Copy `.env.example` → environment secrets store (never commit real values).
2. Confirm **required** keys from `auditProductionEnvironment()`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` — **must** be `https://app.auroranexis.com` in production (**no localhost**; not www for app/billing)
   - `MOLLIE_API_KEY` (server-only; `test_` for controlled mode)
3. Confirm **Mollie safety flags**:
   - `MOLLIE_BILLING_ROLLOUT=true` for NEW Mollie checkout eligibility
   - `MOLLIE_LIVE_CHARGING_ENABLED=false` for SAFE CONTROLLED PRODUCTION MODE
   - Optional `MOLLIE_BILLING_ORG_ALLOWLIST` (comma-separated org UUIDs)
4. Confirm **recommended**:
   - `CRON_SECRET` (required for non-development cron auth)
   - SMTP / email credentials
   - `SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `INTEGRATION_SECRET_KEY`
5. Confirm **forbidden in production**:
   - `TURNSTILE_DISABLE`, `E2E_DISABLE_RATE_LIMIT`, `DEV_FORCE_PLAN` as live overrides
6. Do **not** set FastSpring/Paddle/Stripe checkout keys for active billing.
7. Run diagnostics / readiness panels after deploy (Settings → Diagnostics).

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
2. Set production env vars in Vercel (Mollie API key + rollout/LIVE flags per §2).
3. Confirm Mollie webhook architecture: payment/subscription creates send per-resource `webhookUrl` → `https://app.auroranexis.com/api/mollie/webhook` (`NEXT_PUBLIC_APP_URL` must match). **DASHBOARD_WEBHOOK_REQUIRED = NO**. Do **not** configure Next-Gen Dashboard webhooks against the classic endpoint.
4. Confirm Vercel Cron calls `GET /api/cron/run` with `Authorization: Bearer $CRON_SECRET` every **5 minutes** (`vercel.json`). Vercel Cron always uses GET; when `CRON_SECRET` is set, Vercel attaches the Bearer header automatically.
5. Promote deployment (Release chapter only).
6. Do **not** enable apex→`/api` redirects that break webhooks (`vercel.json` already excludes `api`).
7. Legacy `/api/fastspring/webhook` returns **410 Gone** — do not register it in any provider dashboard.

---

## 6. Post-deploy validation

| Check | Expectation |
|-------|-------------|
| `GET /api/ready` | `200` + `ready: true` |
| `GET /api/health` | `healthy` or intentional `degraded` (AI optional); `configuration.mollie` true when key set |
| Mollie webhook | Per-resource `webhookUrl` + classic payment id + API re-fetch + idempotent ledger (Dashboard registration not required) |
| Cron | Authorized; `queue_worker` / `webhook_retries` execute |
| Auth | Login / logout / session refresh |
| Portal | Client portal login + report visibility |
| Billing | Mollie TEST checkout / settings (no LIVE charges while LIVE flag false) |
| SEO | `robots.txt` / sitemap public-only |
| Observability | Sentry + consent-gated PostHog |

---

## 7. Asset & domain configuration

| Item | Production value |
|------|------------------|
| Marketing canonical | `https://www.auroranexis.com` |
| App | `https://app.auroranexis.com` (`NEXT_PUBLIC_APP_URL` must equal this in production) |
| Apex | Redirect to www via `vercel.json` (API paths excluded) |
| Cookie / auth redirects | Match `NEXT_PUBLIC_APP_URL` + Supabase Auth allow-list |

See `src/lib/deployment/production-domains.ts`.

---

## 8. Feature / kill switches (safe defaults)

| Switch | Production rule |
|--------|-----------------|
| Plan entitlements | `resolveOrganizationEntitlements` — not ad-hoc flags |
| `AI_PROVIDER=disabled` | Safe AI kill-switch |
| `DEV_FORCE_PLAN` | Ignored when `NODE_ENV=production` |
| `MOLLIE_LIVE_CHARGING_ENABLED` | Must remain `false` until LIVE approval |
| `MOLLIE_BILLING_ROLLOUT` | Master switch for NEW Mollie checkout |
| `BILLING_PROVIDER` | Abandoned — Mollie is always the active provider |
| E2E bypass env vars | Never set on Vercel Production |

---

## 9. Background services

Registered jobs (`src/lib/jobs/registry.ts`): report schedules, SLA alerts, connector sync, billing snapshots, predictive refresh, automation maintenance, retention cleanup, **webhook_retries (*/5)**, **queue_worker (*/5)**.

Platform cron must invoke `/api/cron/run` at least every 5 minutes so due 5-minute jobs are not starved.

---

## 10. Rollback pointer

If post-deploy validation fails → [rollback-plan.md](./rollback-plan.md).
