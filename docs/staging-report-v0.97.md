# Staging Report — Phase 5 Sprint 2 (v0.97)

**Date:** 2025-06-23  
**Environment:** `staging.auroranexis.com`  
**Target:** Staging Online Ready

---

## Summary

Staging rollout documentation and validation tooling are complete. Live staging verification is an operator step after Vercel deploy and Supabase migration.

---

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Migrations | ✅ Documented | `supabase db push` + `validate_staging.sql` |
| RLS | ✅ Audited in docs | Spot-check policies post-deploy |
| Storage buckets | ✅ Documented | `white-label-assets` |
| Cron | ✅ Configured | `vercel.json` + `CRON_SECRET` |
| Queue | ✅ Tables in migration | Diagnostics panel |
| Health probe | ✅ Live route | `/api/health` |

---

## Build pipeline (local)

| Check | Expected |
|-------|----------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (warnings only) |
| `npm run build` | Pass |
| `npm run test:e2e` | 4/4 smoke; full suite with `E2E_*` creds |

---

## Post-deploy staging checklist

### Core

- [ ] `GET /api/health` → `"status":"healthy"`
- [ ] Login / signup / invite flow
- [ ] Dashboard loads with platform status widget (owner)

### Stripe (test mode)

See [stripe-staging-validation.md](./stripe-staging-validation.md):

- [ ] Checkout
- [ ] Portal
- [ ] Invoices
- [ ] Webhook idempotency
- [ ] `subscription.updated`, `invoice.payment_failed`

### Connectors

See [connectors-staging-validation.md](./connectors-staging-validation.md):

- [ ] OAuth + callback for at least Google + GitHub
- [ ] Disconnect
- [ ] Diagnostics health rows

### Demo workspace

- [ ] Org `aurora-demo` seeded
- [ ] Counts: 10 clients, 20 reports, 8 risks, 5 incidents, 5 automations, 3 connectors

---

## Observability on staging

| Tool | Env var | Verify |
|------|---------|--------|
| Sentry | `SENTRY_DSN` | Trigger test error → event in Sentry |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY` | Pageview in PostHog live events |
| Uptime | External monitor | `/api/health` 200 |

---

## Recommendation

**Approve staging for pilot traffic** after operator completes post-deploy checklist above.

---

## Related

- [staging-report.md](./staging-report.md) (Sprint 0/1)
- [deployment-report-v0.97.md](./deployment-report-v0.97.md)
- [pilot-readiness-report.md](./pilot-readiness-report.md)
