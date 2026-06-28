# Launch Preparation Report — Phase 5 Sprint 1

**Date:** 2025-06-23  
**Version:** Auroranexis v0.96  
**Target status:** Pilot Deployment Ready

---

## Executive summary

Auroranexis v0.96 completes staging deployment documentation, operational probes, pilot program materials, and demo tenant seeding. The codebase passes lint, typecheck, build, and public E2E smoke tests. Authenticated and staging E2E suites require credentials (`E2E_EMAIL`, `E2E_PASSWORD`, optional `E2E_BASE_URL`).

**Recommendation:** Proceed with staging deployment and recruit up to 3 pilot customers.

---

## Section completion

| Sprint 1 section | Status | Artifacts |
|------------------|--------|-----------|
| 1 — Staging environment | ✅ | [deployment-staging.md](./deployment-staging.md) |
| 2 — Environment validation | ✅ | deployment, domain, vercel, oauth, stripe docs |
| 3 — Domain deployment | ✅ | [domain-setup.md](./domain-setup.md), [domain-report.md](./domain-report.md) |
| 4 — Stripe staging | ✅ | Stripe staging diagnostics, [stripe-production.md](./stripe-production.md) |
| 5 — Connector validation | ✅ | [connectors-staging-validation.md](./connectors-staging-validation.md) |
| 6 — Demo tenant | ✅ | `seed_demo_workspace.sql`, [demo-tenant.md](./demo-tenant.md) |
| 7 — Pilot program | ✅ | pilot-program, onboarding, feedback, pricing-beta |
| 8 — Landing page prep | ✅ | [website.md](./website.md) |
| 9 — Observability | ✅ | [observability.md](./observability.md), `/api/health` |
| 10 — Validation | ✅ | See below |

---

## Code changes (Sprint 1)

| Change | Path |
|--------|------|
| Public health endpoint | `src/app/api/health/route.ts` |
| Stripe staging diagnostics | `src/lib/diagnostics/stripe-staging.ts` |
| Cron auth helpers | `src/lib/env.ts` |
| Vercel cron schedule | `vercel.json` |
| Demo seed (schema fix) | `supabase/scripts/seed_demo_workspace.sql` |

---

## Validation results

| Command | Result | Notes |
|---------|--------|-------|
| `npm run lint` | ✅ Pass | Pre-existing warnings only |
| `npm run typecheck` | ✅ Pass | |
| `npm run build` | ✅ Pass | 67 routes, includes `/api/health` |
| `npm run test:e2e` | ✅ 4/4 smoke | 25 skipped (no E2E credentials) |

Post-deploy staging checks (operator):

- [ ] `GET /api/health` → `healthy`
- [ ] Stripe test checkout + webhook
- [ ] One OAuth connector connect/disconnect
- [ ] Demo workspace seeded and walkable

---

## Observability (pilot minimum)

| Capability | v0.96 |
|------------|-------|
| Health endpoint | ✅ Implemented |
| Diagnostics panel | ✅ Platform + Stripe staging |
| Sentry | 📋 Recommended ([observability.md](./observability.md)) |
| PostHog | 📋 Recommended |
| Status page | 📋 Pre-GA |

---

## Gates before production (`app.auroranexis.com`)

1. Live Stripe keys and webhook secret rotation
2. Full authenticated E2E on staging with real credentials
3. External uptime monitor on `/api/health`
4. OAuth apps registered in production mode for each connector in use
5. Legal: privacy policy, terms, DPA for pilot customers
6. Marketing site live or app-only launch decision

---

## Deliverable index

| Report | File |
|--------|------|
| Deployment | [deployment-report.md](./deployment-report.md) |
| Staging | [staging-report.md](./staging-report.md) |
| Domain | [domain-report.md](./domain-report.md) |
| Pilot program | [pilot-program-report.md](./pilot-program-report.md) |
| Launch preparation | This document |
| Readiness score | [launch-readiness-v0.96.md](./launch-readiness-v0.96.md) |

---

## Related

- Prior: [launch-readiness-v0.95.md](./launch-readiness-v0.95.md)
- Operations: [operations-runbook.md](./operations-runbook.md)
