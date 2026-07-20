> **ARCHIVED (Build Bible V2 Chapter 14).** Use [enterprise-deployment.md](./enterprise-deployment.md), [enterprise-release-checklist.md](./enterprise-release-checklist.md), and [rollback-plan.md](./rollback-plan.md). Historical Stripe-era notes below are not authoritative.
# Deployment Guide â€” v0.99

**Date:** 2025-06-23  
**Version:** Auroranexis v0.99.0  
**Sprint:** Phase 5 Sprint 4 â€” Staging Deployment, Production Validation & Cost Analysis  
**Status:** Production Deployment Ready

---

## Target domains

| Domain | Purpose | Vercel project |
|--------|---------|----------------|
| `auroranexis.com` | Marketing site | auroranexis-marketing (optional) or production project |
| `app.auroranexis.com` | Production application | auroranexis-production |
| `staging.auroranexis.com` | Staging / pilot validation | auroranexis-staging |

---

## Vercel configuration

### `vercel.json`

| Item | Value | Status |
|------|-------|--------|
| Cron path | `/api/cron/run` | Configured |
| Cron schedule | `*/15 * * * *` (every 15 min) | Configured |
| Health cache | `Cache-Control: no-store` on `/api/health` | Configured |

### Build pipeline

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

| Check | Expected |
|-------|----------|
| Lint | PASS |
| Typecheck | PASS |
| Build | PASS (~102 routes) |
| E2E | 29/29 with `E2E_EMAIL` + `E2E_PASSWORD` |

---

## Deployment verification checklist

### Preview deployments

- [ ] PR opens â†’ Vercel preview URL generated
- [ ] Preview uses Preview-scoped env vars (test Stripe)
- [ ] `/api/health` returns JSON (200 or 503 degraded)

### Production deployment

- [ ] `main` branch auto-deploys to production project
- [ ] Build completes without errors
- [ ] `/api/health` returns `status: healthy` when DB + infra OK

### Custom domains

- [ ] `staging.auroranexis.com` â†’ staging project Production env
- [ ] `app.auroranexis.com` â†’ production project Production env
- [ ] `auroranexis.com` â†’ marketing routes (same or separate project)
- [ ] DNS CNAME/A records verified (see [dns-report.md](./dns-report.md))

### SSL

- [ ] Vercel auto-provisions Let's Encrypt certificates
- [ ] HTTPS redirect enforced
- [ ] Deployment readiness â†’ SSL / HTTPS = green on staging/production

### Caching

- [ ] `/api/health` â€” no-store (configured in `vercel.json`)
- [ ] Marketing pages â€” Next.js static/ISR where applicable
- [ ] Authenticated dashboard â€” dynamic, no CDN cache on private routes

### ISR

- [ ] Marketing route group uses static generation where possible
- [ ] Revalidate on demand for content updates

### Cron jobs

- [ ] `CRON_SECRET` set in Vercel Production env
- [ ] Vercel Cron invokes `/api/cron/run` every 15 minutes
- [ ] Diagnostics â†’ Cron infrastructure shows healthy

### Environment variables

Copy from [.env.example](../.env.example) and [vercel-checklist.md](./vercel-checklist.md).

Required for staging/production:

- Supabase URL + keys
- `NEXT_PUBLIC_APP_URL` (per environment)
- `CRON_SECRET`
- `INTEGRATION_SECRET_KEY`
- Stripe test (staging) or live (production) keys
- OAuth client IDs for connectors in use

Optional:

- Sentry DSN, PostHog key
- Resend, OpenAI

---

## Endpoint validation

| Endpoint | Expected |
|----------|----------|
| `GET /api/health` | JSON `{ status, version, checks, latencyMs }` |
| `GET /robots.txt` | Allow/disallow rules for marketing + app |
| `GET /sitemap.xml` | Public marketing routes |
| Marketing pages | OpenGraph + Twitter meta via `createMarketingMetadata` |

---

## Deploy sequence

1. `supabase db push` on target project
2. Run `supabase/scripts/validate_staging.sql`
3. Configure Vercel env vars (staging project first)
4. Assign `staging.auroranexis.com`
5. Deploy â†’ verify `/api/health`, `/robots.txt`, `/sitemap.xml`
6. Register Stripe webhook + OAuth callbacks
7. Seed `aurora-demo` workspace ([demo-tenant.md](./demo-tenant.md))
8. Set `E2E_EMAIL` / `E2E_PASSWORD` â†’ run full E2E suite
9. Promote to `app.auroranexis.com` when staging sign-off complete

---

## Rollback

Promote previous Vercel deployment from Deployments tab â€” see [vercel-deployment.md](./vercel-deployment.md#rollback-strategy).

---

## Related

- [staging-validation.md](./staging-validation.md)
- [production-readiness-v0.99.md](./production-readiness-v0.99.md)
- [platform-costs.md](./platform-costs.md)

