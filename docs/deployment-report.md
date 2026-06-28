# Deployment Report — Phase 5 Sprint 1

**Date:** 2025-06-23  
**Version:** Auroranexis v0.96  
**Sprint:** Staging Deployment & Pilot Program Foundation

---

## Summary

Sprint 1 delivers deployment documentation, environment validation guides, health endpoint, Stripe staging diagnostics, demo tenant seed script, pilot program materials, and Vercel cron configuration. No new business features were added.

**Status:** **Pilot Deployment Ready** — deploy to `staging.auroranexis.com` following documented checklists.

---

## Architecture

| Domain | Role |
|--------|------|
| `auroranexis.com` | Marketing landing (content plan in [website.md](./website.md)) |
| `app.auroranexis.com` | Production SaaS application |
| `staging.auroranexis.com` | Staging / pilot environment |

---

## Deliverables

| Item | Location | Status |
|------|----------|--------|
| Staging deployment guide | [deployment-staging.md](./deployment-staging.md) | ✅ |
| Domain & DNS setup | [domain-setup.md](./domain-setup.md) | ✅ |
| Vercel checklist | [vercel-checklist.md](./vercel-checklist.md) | ✅ |
| OAuth setup | [oauth-setup.md](./oauth-setup.md) | ✅ |
| Stripe production/staging | [stripe-production.md](./stripe-production.md) | ✅ |
| Connector validation | [connectors-staging-validation.md](./connectors-staging-validation.md) | ✅ |
| Health endpoint | `GET /api/health` | ✅ |
| Vercel cron | `vercel.json` → `/api/cron/run` every 15 min | ✅ |
| Stripe staging diagnostics | Settings → Diagnostics | ✅ |

---

## Environment variables validated (documented)

All required variables are listed in [deployment-staging.md](./deployment-staging.md) and [vercel-checklist.md](./vercel-checklist.md):

- Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs
- App: `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `INTEGRATION_SECRET_KEY`
- AI: `OPENAI_API_KEY`
- Connectors: `GOOGLE_*`, `MICROSOFT_*`, `GITHUB_*`, and provider-specific OAuth pairs

---

## Pre-deploy steps

1. Apply migration `20250624140000_production_infrastructure.sql` on staging Supabase
2. Configure Vercel environment variables (staging project)
3. Add domain `staging.auroranexis.com` in Vercel
4. Configure Stripe test webhook → `https://staging.auroranexis.com/api/stripe/webhook`
5. Register OAuth redirect URIs per [oauth-setup.md](./oauth-setup.md)
6. Deploy from main/staging branch
7. Verify `GET /api/health` returns `healthy`
8. Seed demo workspace per [demo-tenant.md](./demo-tenant.md)

---

## Build validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass (warnings only) |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npm run test:e2e` | See [e2e-results.md](./e2e-results.md) / staging report |

---

## Related reports

- [staging-report.md](./staging-report.md)
- [domain-report.md](./domain-report.md)
- [pilot-program-report.md](./pilot-program-report.md)
- [launch-preparation-report.md](./launch-preparation-report.md)
- [launch-readiness-v0.96.md](./launch-readiness-v0.96.md)
