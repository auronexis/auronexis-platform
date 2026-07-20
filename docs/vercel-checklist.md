# Vercel Deployment Checklist

> Prefer the canonical [enterprise-release-checklist.md](./enterprise-release-checklist.md) and [enterprise-deployment.md](./enterprise-deployment.md).

**Use for:** Staging and production Vercel projects (Paddle-only billing).

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
- [ ] `PADDLE_API_KEY`
- [ ] `PADDLE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- [ ] `PADDLE_ENVIRONMENT` — `sandbox` on Preview/Staging; `production` on Production
- [ ] `CRON_SECRET`

### Recommended

- [ ] Email provider (`RESEND_API_KEY` or configured alternative)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`
- [ ] Paddle price ID mappings for sold plans
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`

### Forbidden on Production

- [ ] `TURNSTILE_DISABLE`
- [ ] `E2E_DISABLE_RATE_LIMIT`
- [ ] `DEV_FORCE_PLAN`
- [ ] Stripe live keys as active billing configuration — **forbidden** (Paddle-only)

---

## Domains & cron

- [ ] Apex → www redirects exclude `/api/*` (see `vercel.json`)
- [ ] Cron path `/api/cron/run` every **5 minutes**
- [ ] Paddle webhook points at `/api/paddle/webhook`

---

## Post-promote

- [ ] `GET /api/ready` → 200
- [ ] `GET /api/health` not `unavailable`
- [ ] Auth login smoke
- [ ] Paddle checkout/portal smoke on staging before production cutover
