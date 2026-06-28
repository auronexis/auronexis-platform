# Production Readiness — v0.99

**Date:** 2025-06-23  
**Version:** Auroranexis v0.99.0  
**Status:** Production Deployment Ready  
**Target score:** ≥ 97/100

---

## Readiness dimensions (13)

Production readiness is computed in Settings → Diagnostics from workspace + static checks:

| # | Dimension | Source |
|---|-----------|--------|
| 1 | Stripe readiness | Webhook health + billing |
| 2 | Cron readiness | Job schedules |
| 3 | Queue readiness | Queue jobs table |
| 4 | OAuth readiness | Configured connectors |
| 5 | Connector readiness | Connection health |
| 6 | Billing readiness | Stripe connected |
| 7 | API readiness | Public API diagnostics |
| 8 | Compliance readiness | Framework tables |
| 9 | AI readiness | Provider health |
| 10 | Predictive readiness | Forecast data |
| 11 | Launch polish | Legal, marketing, help |
| 12 | Pilot acquisition | Website, pilot surfaces |
| 13 | **Deployment readiness** | Vercel, cron, SEO, SSL *(new v0.99)* |

Implementation: `src/lib/diagnostics/production-readiness.ts`, `deployment-readiness.ts`

---

## Score tiers

| Score | Label |
|-------|-------|
| ≥ 99 | Enterprise Ready |
| ≥ 97 | **Production Ready** |
| ≥ 90 | Pilot Ready |
| < 90 | Not Ready |

*(Updated from v0.98: Production Ready threshold raised from 88 → 97)*

---

## Expected scores (fully configured staging)

| Dimension | Target |
|-----------|--------|
| Launch polish | 100 |
| Pilot acquisition | 100 |
| Deployment readiness | 100 |
| Compliance | 90+ |
| Cron / Queue | 88–95 |
| Stripe / Billing | 90+ (with webhook secret) |
| OAuth | 85+ (≥1 connector configured) |
| **Overall** | **≥ 97** |

Local development without `CRON_SECRET`, Stripe webhook, or OAuth may score lower — expected behavior.

---

## Platform readiness (separate)

Environment-aware platform status (`getPlatformReadinessStatus`):

| Tier | Score |
|------|-------|
| Production Ready | ≥ 97 |
| Pilot Ready | ≥ 90 |
| Development | ≥ 75 |

Dev environments show **Development** or **Partially Configured** instead of **Unavailable** when optional services (Stripe, Sentry, Cron) are missing.

---

## Deployment readiness checks

| Check | Staging expectation |
|-------|---------------------|
| Vercel cron | ✅ `/api/cron/run` every 15 min |
| Health endpoint | ✅ `/api/health` |
| Robots + sitemap | ✅ Generated routes |
| OpenGraph | ✅ Marketing metadata |
| SSL / HTTPS | ✅ Custom domain |
| Version | ✅ 0.99.0 |
| Cron secret | ✅ Vercel env |
| Vercel deployment | ✅ `VERCEL` env present |

---

## Pilot readiness

| Gate | v0.98 | v0.99 |
|------|-------|-------|
| Marketing site | ✅ | ✅ |
| Legal pages | ✅ | ✅ |
| Pilot program page | ✅ | ✅ |
| Demo workspace | Documented | Seed + validate |
| Staging online | Planned | **Target: staging.auroranexis.com** |
| First pilot customer | — | **Ready after operator sign-off** |

---

## Launch readiness progression

| Version | Status |
|---------|--------|
| v0.97 | Staging Online Ready |
| v0.98 | Pilot Customer Acquisition Ready |
| **v0.99** | **Production Deployment Ready** |

---

## Validation commands

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e   # 29/29 with E2E_EMAIL + E2E_PASSWORD
```

---

## Operator sign-off checklist

- [ ] Staging deployed and health green
- [ ] `validate_staging.sql` clean
- [ ] Stripe test matrix complete ([stripe-validation.md](./stripe-validation.md))
- [ ] OAuth callbacks registered ([oauth-validation.md](./oauth-validation.md))
- [ ] Demo workspace seeded
- [ ] E2E 29/29 on staging
- [ ] Diagnostics overall ≥ 97
- [ ] Bootstrap infra ≤ €100/mo confirmed ([cost-analysis.md](./cost-analysis.md))

---

## Related

- [deployment-v0.99.md](./deployment-v0.99.md)
- [staging-validation.md](./staging-validation.md)
- [launch-readiness-v0.98.md](./launch-readiness-v0.98.md)
