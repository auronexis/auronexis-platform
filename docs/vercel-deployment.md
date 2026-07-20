> **ARCHIVED (Build Bible V2 Chapter 14).** Use [enterprise-deployment.md](./enterprise-deployment.md), [enterprise-release-checklist.md](./enterprise-release-checklist.md), and [rollback-plan.md](./rollback-plan.md). Historical Stripe-era notes below are not authoritative.
# Vercel Deployment Guide

**Version:** Auroranexis v0.97  
**Sprint:** Phase 5 Sprint 2 â€” Deployment & Staging Rollout  
**Target:** `staging.auroranexis.com`

---

## Project structure

| Vercel project | Branch | Domain | Environment |
|----------------|--------|--------|-------------|
| **auroranexis-staging** | `staging` or `main` | `staging.auroranexis.com` | Preview + Production (staging) |
| **auroranexis-production** | `main` | `app.auroranexis.com` | Production |
| **auroranexis-marketing** (optional) | `main` | `auroranexis.com` | Production |

Use separate projects for staging and production to isolate secrets and Stripe modes.

---

## Branch strategy

### Production branch

- **Branch:** `main`
- **Auto-deploy:** Production environment on `app.auroranexis.com`
- **Protection:** Require PR review; no direct pushes

### Preview branch

- **Branches:** All non-`main` branches + PRs
- **URL:** `*.vercel.app` or branch-specific preview domains
- **Env:** Preview-scoped variables (test Stripe, staging Supabase optional)

### Staging branch

- **Branch:** `staging` (recommended) or dedicated `main` deploy to staging project
- **Domain:** `staging.auroranexis.com` assigned to **Production** env of staging project
- **Note:** Assign custom domain to Production (not Preview) for stable OAuth callbacks

---

## Environment variables

Copy from [vercel-checklist.md](./vercel-checklist.md). Set per Vercel environment:

| Scope | Use |
|-------|-----|
| **Production** (staging project) | Staging secrets + `NEXT_PUBLIC_APP_URL=https://staging.auroranexis.com` |
| **Production** (prod project) | Live Stripe + `NEXT_PUBLIC_APP_URL=https://app.auroranexis.com` |
| **Preview** | Test keys; optional `DEV_FORCE_PLAN=enterprise` |
| **Development** | Local `.env.local` only |

**Never** commit `.env.local`. Use Vercel â†’ Settings â†’ Environment Variables.

---

## Build configuration

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Node.js | 22.x |
| Install | `npm install` |
| Build | `npm run build` |
| Output | Default (App Router) |

### Local validation (pre-deploy)

```bash
npm run lint
npm run typecheck
npm run build
```

### Vercel CLI (optional)

```bash
npx vercel link
npx vercel env pull .env.local
npx vercel build    # simulates Vercel build locally
npx vercel deploy --prebuilt
```

---

## Cron support

Root `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/run",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Requirements:

- [ ] `CRON_SECRET` set in Vercel (Production)
- [ ] Cron visible under Settings â†’ Cron Jobs after deploy
- [ ] Manual test:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://staging.auroranexis.com/api/cron/run
```

---

## Build hooks

Optional deploy triggers:

1. Vercel â†’ Settings â†’ Git â†’ Deploy Hooks
2. Create hook URL for staging rebuilds after Supabase migration
3. Store hook URL in team secrets (not git)

Use after `supabase db push` to ensure app and schema stay aligned.

---

## Health checks

| Probe | URL | Expected |
|-------|-----|----------|
| Public health | `GET /api/health` | `200`, `"status":"healthy"` |
| Login | `GET /login` | `200` |
| Diagnostics | `GET /settings/diagnostics` | `200` (authenticated) |

Configure external uptime monitor (Better Stack, UptimeRobot) on `/api/health` every 5 minutes.

Dashboard **Platform status** widget (owner/admin) mirrors internal checks.

---

## Deployment logs

After each deploy:

1. Vercel â†’ Deployments â†’ select deployment â†’ **Building** tab
2. Confirm: `Compiled successfully`, no TypeScript errors
3. **Functions** tab: verify `/api/health`, `/api/cron/run`, `/api/paddle/webhook` (Stripe webhook path retired — see enterprise-deployment.md)
4. **Runtime Logs**: smoke test login + health endpoint

Common failures:

| Error | Fix |
|-------|-----|
| Missing env var | Add in Vercel, redeploy |
| Supabase connection | Check `NEXT_PUBLIC_SUPABASE_URL`, service role key |
| Stripe webhook 401 | Verify `STRIPE_WEBHOOK_SECRET` matches Dashboard |
| Cron 401 | Set `CRON_SECRET`, use Bearer header |

---

## Rollback strategy

### Instant rollback (preferred)

1. Vercel â†’ Deployments â†’ find last known-good deployment
2. â‹® menu â†’ **Promote to Production**
3. Verify `/api/health` and login

### Git revert

```bash
git revert <bad-commit-sha>
git push origin main   # or staging
```

### Database rollback

- Migrations are forward-only â€” do **not** revert SQL without DBA review
- Use Supabase branch reset for staging disasters ([disaster-recovery.md](./disaster-recovery.md))

### Stripe rollback

- Webhook endpoint unchanged during app rollback
- Idempotency table prevents duplicate processing

---

## First staging deploy checklist

- [ ] Supabase migrations applied (`supabase db push`)
- [ ] All env vars set in Vercel staging project
- [ ] Domain `staging.auroranexis.com` verified
- [ ] Stripe test webhook registered
- [ ] OAuth redirect URIs registered ([oauth-setup.md](./oauth-setup.md))
- [ ] `npm run build` passes locally
- [ ] Deploy succeeds on Vercel
- [ ] `GET /api/health` returns healthy
- [ ] Demo workspace seeded ([demo-tenant.md](./demo-tenant.md))
- [ ] Run `supabase/scripts/validate_staging.sql`

---

## Related

- [vercel-checklist.md](./vercel-checklist.md)
- [deployment-staging.md](./deployment-staging.md)
- [domain-setup.md](./domain-setup.md)
- [supabase-staging.md](./supabase-staging.md)

