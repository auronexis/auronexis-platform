# Vercel Production — v1.0.3

**Version:** 1.0.3  
**Status:** Launch Candidate

## Environment separation

| Scope | Hostname | Stripe | Supabase |
|-------|----------|--------|----------|
| Development | `localhost:3000` | Test | Dev/staging |
| Preview | `*.vercel.app` | Test | Staging optional |
| Staging | `staging.auroranexis.com` | Test | Staging project |
| Production | `app.auroranexis.com` | Live | Production project |

## Environment variable groups

**Core:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`

**Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**OAuth:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `INTEGRATION_SECRET_KEY` (+ provider-specific keys)

**Mail:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

## Cron

`vercel.json` — `/api/cron/run` every 15 minutes. Set `CRON_SECRET` in production.

## Diagnostics

`src/lib/diagnostics/vercel-production-readiness.ts`

See also [vercel-production.md](./vercel-production.md) for full matrix.
