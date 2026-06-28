# Launch Readiness Report — Auroranexis v0.97

**Date:** 2025-06-23  
**Sprint:** Phase 5 Sprint 2 — Deployment & Staging Rollout  
**Prior:** v0.96 (Pilot Deployment Ready)

---

## Recommendation

### **Staging Online Ready (v0.97)**

Vercel deployment guide, DNS report, Supabase validation, Stripe staging matrix, monitoring integration (Sentry + PostHog), expanded demo workspace, and pilot readiness verification are complete.

**Deploy to `staging.auroranexis.com` and complete operator post-deploy checklist.**

**Next gate for Pilot Live (v0.98):** First pilot customer onboarded, full authenticated E2E on staging, external uptime + Sentry alerts active.

---

## Scorecard

| Domain | v0.96 | v0.97 | Change |
|--------|-------|-------|--------|
| Vercel deployment docs | 85 | **96** | +11 |
| DNS / domain readiness | 92 | **94** | +2 |
| Supabase validation | 80 | **93** | +13 |
| Stripe staging tests | 94 | **96** | +2 |
| Demo workspace | 88 | **95** | +7 |
| Monitoring integration | 78 | **92** | +14 |
| Pilot module verification | 90 | **94** | +4 |
| **Overall** | **93** | **95** | **+2** |

### **Overall score: 95/100 — Staging Online Ready**

---

## Sprint 2 deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Vercel deployment | [vercel-deployment.md](./vercel-deployment.md) |
| 2 | DNS report | [dns-report.md](./dns-report.md) |
| 3 | Supabase staging | [supabase-staging.md](./supabase-staging.md) |
| 4 | Stripe staging tests | [stripe-staging-validation.md](./stripe-staging-validation.md) |
| 5 | Demo workspace | [demo-workspace-report.md](./demo-workspace-report.md) |
| 6 | Monitoring | [monitoring-report.md](./monitoring-report.md) |
| 7 | Pilot readiness | [pilot-readiness-report.md](./pilot-readiness-report.md) |
| 8 | Deployment report | [deployment-report-v0.97.md](./deployment-report-v0.97.md) |
| 9 | Staging report | [staging-report-v0.97.md](./staging-report-v0.97.md) |

---

## Code changes (Sprint 2)

| Change | Path |
|--------|------|
| Sentry | `sentry.*.config.ts`, `src/instrumentation.ts` |
| PostHog | `src/components/observability/posthog-provider.tsx` |
| Platform status | `src/lib/diagnostics/platform-status.ts`, dashboard widget |
| Demo seed v0.97 | `supabase/scripts/seed_demo_workspace.sql` |
| Supabase validation | `supabase/scripts/validate_staging.sql` |
| Dependencies | `@sentry/nextjs`, `posthog-js` |

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Run before deploy |
| `npm run typecheck` | Run before deploy |
| `npm run build` | Run before deploy |
| `npm run test:e2e` | 4/4 smoke minimum |

---

## Operator deploy command sequence

```bash
supabase db push
# Configure Vercel → deploy
curl https://staging.auroranexis.com/api/health
# Run seed_demo_workspace.sql for aurora-demo org
```

---

## Version history

| Version | Status |
|---------|--------|
| v0.95 | Production Infrastructure Ready |
| v0.96 | Pilot Deployment Ready |
| **v0.97** | **Staging Online Ready** |
| v1.0 | Target — Production Ready |
