# Deployment Guide

How to deploy Auroranexis to production (Release Candidate v0.1.0).

## Prerequisites

- Node.js 22+
- Supabase project with migrations applied
- Stripe account with products/prices configured
- Resend account (report email delivery)
- OpenAI API key (AI features)

## Environment variables

Copy `.env.example` to `.env.local` for local development. In production, set variables in your hosting provider (e.g. Vercel).

### Required — public (safe in browser)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL for auth redirects |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe checkout elements |

### Required — server only

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Org bootstrap, webhooks (never expose) |
| `STRIPE_SECRET_KEY` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `STRIPE_STARTER_PRICE_ID` | Starter plan price |
| `STRIPE_PROFESSIONAL_PRICE_ID` | Professional plan price |
| `STRIPE_BUSINESS_PRICE_ID` | Business plan price |
| `STRIPE_ENTERPRISE_PRICE_ID` | Enterprise plan price |
| `RESEND_API_KEY` | Email delivery |
| `RESEND_FROM_EMAIL` | Verified sender |
| `OPENAI_API_KEY` | AI provider |
| `AI_PROVIDER` | Provider id (default: `openai`) |
| `OPENAI_MODEL` | Model id (default: `gpt-4o-mini`) |

### Optional

| Variable | Purpose |
|----------|---------|
| `STRIPE_PRICE_ID` | Legacy fallback price id |
| `DEV_FORCE_PLAN` | Local only — override plan without Stripe |

## Build & run

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm start
```

Development:

```bash
npm run dev
```

## Database migrations

Apply Supabase migrations from the project migration folder before first deploy. Verify RLS policies are enabled on all tenant tables. See [database.md](./database.md).

## Stripe webhooks

Configure Stripe to send events to:

```
https://<your-domain>/api/stripe/webhook
```

Required events include subscription lifecycle events used by `src/lib/billing/`.

## Post-deploy verification

1. Sign up / log in
2. Complete Stripe checkout on a test plan
3. Open **Settings → Diagnostics** (owner/admin) — confirm:
   - Database: Connected
   - Stripe: configured
   - AI provider: resolved
   - Build version matches release
4. Exercise core flows: client CRUD, report generation, AI assistant (if plan allows)

## Hosting recommendations

- **Vercel** — Native Next.js 15 support; set env vars per environment
- Enable preview deployments with separate Supabase/Stripe test keys
- Use production keys only on the production branch

## Rollback

- Revert to previous deployment in hosting dashboard
- Database migrations are forward-only in RC — avoid breaking schema changes without a maintenance window
