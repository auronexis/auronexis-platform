# Deployment Report — Phase 5 Sprint 2

**Date:** 2025-06-23  
**Version:** Auroranexis v0.97  
**Sprint:** Deployment & Staging Rollout  
**Target:** `staging.auroranexis.com` — **Staging Online Ready**

---

## Summary

Sprint 2 completes Vercel deployment documentation, Supabase validation procedures, Stripe staging test matrix, monitoring integration (Sentry, PostHog, platform status widget), expanded demo workspace seed, and pilot readiness verification guides.

**No new business features.** Deployment and operational readiness only.

---

## Deliverables

| Item | Location | Status |
|------|----------|--------|
| Vercel deployment guide | [vercel-deployment.md](./vercel-deployment.md) | ✅ |
| Supabase staging validation | [supabase-staging.md](./supabase-staging.md), `validate_staging.sql` | ✅ |
| Stripe staging tests | [stripe-staging-validation.md](./stripe-staging-validation.md) | ✅ |
| Sentry integration | `sentry.*.config.ts`, `instrumentation.ts` | ✅ |
| PostHog integration | `PostHogProvider` | ✅ |
| Platform status widget | Dashboard (owner/admin) | ✅ |
| Demo seed v0.97 | `seed_demo_workspace.sql` | ✅ |
| Health endpoint | `GET /api/health` | ✅ (v0.96) |
| Vercel cron | `vercel.json` | ✅ (v0.96) |

---

## Build validation

| Check | Result |
|-------|--------|
| `npm run lint` | Run before deploy |
| `npm run typecheck` | Run before deploy |
| `npm run build` | Run before deploy |
| `npm run test:e2e` | 4/4 smoke (credentials for full suite) |

---

## Deploy sequence

1. `supabase db push` on staging project
2. Configure Vercel staging project env vars
3. Assign `staging.auroranexis.com`
4. Deploy → verify `/api/health`
5. Register Stripe test webhook + OAuth callbacks
6. Seed `aurora-demo` workspace
7. Run Stripe + connector smoke tests
8. Enable Sentry DSN + PostHog key (optional)

---

## Rollback

Promote previous Vercel deployment — see [vercel-deployment.md](./vercel-deployment.md#rollback-strategy).

---

## Related reports

- [dns-report.md](./dns-report.md)
- [staging-report-v0.97.md](./staging-report-v0.97.md)
- [demo-workspace-report.md](./demo-workspace-report.md)
- [monitoring-report.md](./monitoring-report.md)
- [pilot-readiness-report.md](./pilot-readiness-report.md)
- [launch-readiness-v0.97.md](./launch-readiness-v0.97.md)
