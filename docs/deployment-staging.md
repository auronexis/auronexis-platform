# Staging Deployment Guide

**Version:** Auroranexis v0.96  
**Target:** `staging.auroranexis.com`  
**Sprint:** Phase 5 Sprint 1

---

## Environment architecture

| Domain | Purpose | Vercel project | Supabase |
|--------|---------|----------------|----------|
| `auroranexis.com` | Marketing landing (future) | `auroranexis-web` | — |
| `app.auroranexis.com` | Production SaaS | `auroranexis-app` | Production project |
| `staging.auroranexis.com` | Staging / pilot | `auroranexis-staging` | Staging project |

```
                    ┌─────────────────────┐
                    │   auroranexis.com   │
                    │   (Landing / WWW)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │ app.auroranexis.com  │        │ staging.auroranexis  │
   │ Production SaaS      │        │ Staging / Pilot      │
   └──────────┬───────────┘        └──────────┬───────────┘
              │                               │
              ▼                               ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │ Supabase Production  │        │ Supabase Staging     │
   │ Stripe Live          │        │ Stripe Test          │
   └──────────────────────┘        └──────────────────────┘
```

---

## Staging deploy steps

### 1. Supabase staging project

```bash
supabase link --project-ref <staging-project-ref>
supabase db push
```

Apply all migrations including `20250624140000_production_infrastructure.sql`.

Verify: Settings → Database → Migrations show 31 files applied.

### 2. Vercel staging project

1. Import Git repository
2. Set **Root Directory** to repository root
3. Framework: Next.js
4. Set environment variables (see [Environment validation](#environment-validation))
5. Add domain `staging.auroranexis.com`
6. Deploy from `main` or `staging` branch

### 3. Post-deploy smoke test

```bash
curl https://staging.auroranexis.com/api/health
npm run test:e2e  # with PLAYWRIGHT_BASE_URL=https://staging.auroranexis.com
```

### 4. Cron scheduler (staging)

Configure Vercel Cron or external scheduler:

```yaml
# vercel.json (staging project)
{
  "crons": [
    {
      "path": "/api/cron/run",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Set `CRON_SECRET` in Vercel and send `Authorization: Bearer <CRON_SECRET>`.

### 5. Stripe webhook (staging)

Endpoint: `https://staging.auroranexis.com/api/stripe/webhook`

Use **Stripe test mode** webhook secret in `STRIPE_WEBHOOK_SECRET`.

### 6. Demo workspace

After deploy, seed demo data — see [demo-tenant.md](./demo-tenant.md).

---

## Environment validation

Required variables for staging (set in Vercel → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://staging.auroranexis.com` |
| `STRIPE_SECRET_KEY` | Yes | `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Yes | Staging webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | `pk_test_…` |
| `STRIPE_*_PRICE_ID` (4 plans) | Yes | Test mode price IDs |
| `RESEND_API_KEY` | Yes | Email delivery |
| `RESEND_FROM_EMAIL` | Yes | Verified sender |
| `OPENAI_API_KEY` | Optional | AI features in staging |
| `INTEGRATION_SECRET_KEY` | Yes | 64-char hex |
| `CRON_SECRET` | Yes | Cron bearer token |
| `GOOGLE_CLIENT_ID/SECRET` | Per connector | See [oauth-setup.md](./oauth-setup.md) |
| `MICROSOFT_CLIENT_ID/SECRET` | Per connector | |
| `GITHUB_CLIENT_ID/SECRET` | Per connector | |

Validate in app: **Settings → Diagnostics** — all infrastructure sections green or explained.

---

## Staging vs production isolation

| Resource | Staging | Production |
|----------|---------|------------|
| Supabase | Separate project | Separate project |
| Stripe | Test mode keys | Live mode keys |
| OAuth apps | Staging redirect URIs | Production redirect URIs |
| CRON_SECRET | Staging-specific | Production-specific |
| Demo data | Allowed | Never seed demo in prod |

---

## Related

- [domain-setup.md](./domain-setup.md)
- [vercel-checklist.md](./vercel-checklist.md)
- [staging-checklist.md](./staging-checklist.md)
- [operations-runbook.md](./operations-runbook.md)
