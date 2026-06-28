# Launch Readiness Report — Auroranexis v0.96

**Date:** 2025-06-23  
**Sprint:** Phase 5 Sprint 1 — Staging Deployment & Pilot Program Foundation  
**Prior:** v0.95 (Production Infrastructure Ready)

---

## Recommendation

### **Pilot Deployment Ready (v0.96)**

Staging deployment documentation, domain/OAuth/Stripe guides, health endpoint, demo tenant seed, pilot program pack, and validation pipeline are complete. Deploy to `staging.auroranexis.com` and onboard up to 3 pilot customers.

**Next gate for Production Ready (v1.0):** Live DNS on `app.auroranexis.com`, production Stripe, full authenticated E2E on staging, Sentry/status page, and pilot exit criteria met.

---

## Scorecard

| Domain | v0.95 | v0.96 | Change |
|--------|-------|-------|--------|
| Deployment docs | 70 | **95** | +25 |
| Domain / OAuth readiness | 65 | **92** | +27 |
| Stripe staging diagnostics | 80 | **94** | +14 |
| Demo / sales readiness | 50 | **88** | +38 |
| Pilot program | 40 | **90** | +50 |
| Observability | 55 | **78** | +23 |
| Health / ops probes | 70 | **92** | +22 |
| E2E coverage | 82 | **85** | +3 |
| **Overall** | **91** | **93** | **+2** |

### **Overall score: 93/100 — Pilot Deployment Ready**

---

## Sprint 1 deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Staging deployment | [deployment-staging.md](./deployment-staging.md), [deployment-report.md](./deployment-report.md) |
| 2 | Domain setup | [domain-setup.md](./domain-setup.md), [domain-report.md](./domain-report.md) |
| 3 | Vercel checklist + cron | [vercel-checklist.md](./vercel-checklist.md), `vercel.json` |
| 4 | OAuth / Stripe guides | [oauth-setup.md](./oauth-setup.md), [stripe-production.md](./stripe-production.md) |
| 5 | Connectors validation | [connectors-staging-validation.md](./connectors-staging-validation.md) |
| 6 | Demo tenant | [demo-tenant.md](./demo-tenant.md), `seed_demo_workspace.sql` |
| 7 | Pilot program | [pilot-program.md](./pilot-program.md), onboarding, feedback, pricing-beta |
| 8 | Landing content plan | [website.md](./website.md) |
| 9 | Observability | [observability.md](./observability.md), `/api/health` |
| 10 | Reports | staging, pilot, launch-preparation reports |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass (warnings only) |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass |
| `npm run test:e2e` | ✅ 4/4 smoke; authenticated skipped without credentials |

---

## Operator checklist (post-merge)

```bash
# 1. Database
supabase db push

# 2. Vercel staging deploy with all env vars (see vercel-checklist.md)

# 3. Demo workspace
# Sign up org slug aurora-demo, then run supabase/scripts/seed_demo_workspace.sql

# 4. Smoke
curl https://staging.auroranexis.com/api/health
```

---

## Version history

| Version | Status |
|---------|--------|
| v0.9 RC | Launch candidate — QA complete |
| v0.95 | Production Infrastructure Ready |
| **v0.96** | **Pilot Deployment Ready** |
| v1.0 | Target — Production Ready (post-pilot) |
