# Vercel Deployment Checklist

> Prefer the canonical [enterprise-release-checklist.md](./enterprise-release-checklist.md) and [enterprise-deployment.md](./enterprise-deployment.md).

**Use for:** Staging and production Vercel projects (Mollie-only billing · SAFE CONTROLLED PRODUCTION MODE).

---

## Project setup

- [ ] Repository connected to Vercel
- [ ] Node.js version: **22.x**
- [ ] Framework preset: **Next.js**
- [ ] Build command: `npm run build`
- [ ] Install command: `npm ci` (or `npm install`)
- [ ] `vercel.json` crons + security headers applied

---

## Environment variables

### Required

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — encrypted, server only
- [ ] `NEXT_PUBLIC_APP_URL` — HTTPS production/staging host (**no localhost** on Production)
- [ ] `MOLLIE_API_KEY` — server only (`test_` for controlled mode)
- [ ] `MOLLIE_BILLING_ROLLOUT=true`
- [ ] `MOLLIE_LIVE_CHARGING_ENABLED=false` until LIVE approval
- [ ] `CRON_SECRET`

### Recommended

- [ ] Email provider (SMTP production path)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [ ] Optional `MOLLIE_BILLING_ORG_ALLOWLIST`
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `INTEGRATION_SECRET_KEY`

### Forbidden on Production

- [ ] `TURNSTILE_DISABLE`
- [ ] `E2E_DISABLE_RATE_LIMIT`
- [ ] `DEV_FORCE_PLAN`
- [ ] Stripe / Paddle / FastSpring live keys as active billing configuration — **forbidden** (Mollie-only)
- [ ] `MOLLIE_LIVE_CHARGING_ENABLED=true` without P1-002 + explicit LIVE approval

---

## Domains & cron

- [ ] Apex → www redirects exclude `/api/*` (see `vercel.json`)
- [ ] Cron path `/api/cron/run` every **5 minutes**
- [ ] Mollie classic webhook points at `/api/mollie/webhook` (not Next-Gen)

---

## Post-promote

- [ ] `GET /api/ready` → 200
- [ ] `GET /api/health` not `unavailable`; `configuration.mollie` when key set
- [ ] Auth login smoke
- [ ] Mollie TEST checkout smoke on staging before any LIVE cutover
