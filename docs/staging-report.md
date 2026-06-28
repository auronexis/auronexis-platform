# Staging Validation Report — Phase 5 Sprint 1

**Date:** 2025-06-23  
**Environment:** Staging (`staging.auroranexis.com`)  
**Sprint:** Phase 5 Sprint 1 — Staging Deployment & Pilot Foundation  
**Target:** v0.96 Pilot Deployment Ready

---

## Summary

Sprint 1 extends Sprint 0 infrastructure validation with deployment guides, health probing, Stripe staging diagnostics, demo tenant seeding, and pilot readiness documentation. Local build and smoke E2E pass; live staging verification is an operator step after Vercel deploy.

**Recommendation:** Deploy to staging and run post-deploy checklist below.

---

## Build pipeline (local)

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run lint` | ✅ Pass (warnings only) |
| `npm run build` | ✅ Pass |
| `npm run test:e2e` | ✅ 4/4 public smoke; 25 skipped without E2E credentials |

---

## New infrastructure (Sprint 1)

| Component | Result |
|-----------|--------|
| `GET /api/health` | ✅ Implemented — DB, Stripe webhooks, cron, queue |
| Stripe staging diagnostics | ✅ Settings → Diagnostics |
| `vercel.json` cron | ✅ `/api/cron/run` every 15 minutes |
| Demo seed script | ✅ Schema-aligned (`seed_demo_workspace.sql`) |

---

## Environment validation (documented)

All variables validated in documentation — set in Vercel before deploy:

| Variable | Doc reference |
|----------|---------------|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` | [deployment-staging.md](./deployment-staging.md) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | [stripe-production.md](./stripe-production.md) |
| `OPENAI_API_KEY` | [deployment-staging.md](./deployment-staging.md) |
| `INTEGRATION_SECRET_KEY`, `CRON_SECRET` | [vercel-checklist.md](./vercel-checklist.md) |
| `NEXT_PUBLIC_APP_URL` | [domain-setup.md](./domain-setup.md) |
| OAuth client IDs/secrets (13 providers) | [oauth-setup.md](./oauth-setup.md) |

---

## Post-deploy staging checklist

### Health & SSL

- [ ] `curl https://staging.auroranexis.com/api/health` → `"status":"healthy"`
- [ ] Valid TLS certificate
- [ ] `NEXT_PUBLIC_APP_URL` matches hostname

### Stripe (test mode)

- [ ] Checkout session completes
- [ ] Customer Portal opens
- [ ] Webhook test event → 200, idempotency row in `stripe_webhook_events`
- [ ] Diagnostics → Stripe staging readiness all green

### Connectors (sample)

Per [connectors-staging-validation.md](./connectors-staging-validation.md):

- [ ] OAuth authorize → callback → connected
- [ ] Refresh token path (wait or force refresh)
- [ ] Disconnect removes connection
- [ ] Diagnostics shows provider health

### Demo tenant

- [ ] Org `aurora-demo` exists
- [ ] Seed script run — 10 clients, 20 reports visible
- [ ] Sales walkthrough: dashboard → client → report → compliance → diagnostics

### Cron

- [ ] Vercel Cron job visible after deploy
- [ ] Manual `POST /api/cron/run` with `CRON_SECRET` succeeds
- [ ] `job_runs` shows recent entries

---

## Inherited from Sprint 0

| Subsystem | Report |
|-----------|--------|
| Stripe idempotency | [stripe-idempotency-report.md](./stripe-idempotency-report.md) |
| Cron infrastructure | [cron-report.md](./cron-report.md) |
| Queue workers | [queue-report.md](./queue-report.md) |
| Migration | `20250624140000_production_infrastructure.sql` |

---

## E2E staging suite

Set environment variables to run full staging module smoke:

```bash
E2E_BASE_URL=https://staging.auroranexis.com
E2E_EMAIL=pilot@example.com
E2E_PASSWORD=...
npm run test:e2e
```

Without credentials, only public smoke tests execute (4/4 pass locally).

---

## Related

- [staging-checklist.md](./staging-checklist.md)
- [deployment-report.md](./deployment-report.md)
- [launch-readiness-v0.96.md](./launch-readiness-v0.96.md)
