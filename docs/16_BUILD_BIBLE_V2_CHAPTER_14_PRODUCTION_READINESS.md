# Auroranexis Build Bible V2 — Chapter 14: Enterprise Deployment & Production Readiness

**Status:** Implemented  
**Version:** 2.0 Chapter 14  
**Priority:** After Chapter 13 Enterprise Regression

Full requirements are enforced by this document and `.cursor/rules/build-bible-v2-ch14-production-readiness.mdc`.

This chapter prepares production release **without** executing a production deployment, commit, or push.

## Sources of truth

| Concern | Location |
|---------|----------|
| Deployment sequence | `docs/enterprise-deployment.md` |
| Release checklist | `docs/enterprise-release-checklist.md` |
| Rollback | `docs/rollback-plan.md` |
| Disaster recovery | `docs/disaster-recovery.md` |
| Operations runbook | `docs/operations-runbook.md` |
| Paddle billing ops | `docs/paddle-billing.md` |
| Env template | `.env.example` |
| Env audit runtime | `src/lib/env/production-audit.ts` |
| Production domains | `src/lib/deployment/production-domains.ts` |
| Vercel cron / headers | `vercel.json` |
| CI pipeline | `.github/workflows/ci.yml` |
| Readiness tests | `scripts/production-readiness.test.mjs` |
| Chapter compliance | `scripts/build-bible-ch14.test.mjs` |

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run test:build-bible-ch14` | Chapter 14 compliance contracts |
| `npm run test:production-readiness` | Deployment / env / config / checklist contracts |
| `npm run lint` / `typecheck` / `build` | Pre-release gates |
| `npm run test:enterprise-regression` | Chapter 13 regression catalog (includes ch14) |

## Deployment sequence (summary)

1. Environment validation (no localhost APP_URL, Paddle production trio, CRON_SECRET)
2. `npm run lint` → `typecheck` → `test:enterprise-regression` → `build`
3. Apply pending Supabase migrations **in order** (never invent down migrations in prod)
4. Deploy application artifact (Release chapter only)
5. Post-deploy: `/api/ready`, `/api/health`, Paddle webhook, cron auth, portal smoke
6. Rollback readiness confirmed before cutover

## Non-negotiables

- Do not modify business logic, auth, RBAC, RLS, Paddle behaviour, or API contracts
- Do not execute production migrations or production deploys in this chapter
- Do not commit or push from Chapter 14 work
- Paddle is the sole active billing provider
- Never enable `TURNSTILE_DISABLE` or `E2E_DISABLE_RATE_LIMIT` in production
- `DEV_FORCE_PLAN` is ignored in production

## Validation

`npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:build-bible-ch14`, `npm run test:production-readiness`.

Historical Stripe-era deploy notes under `docs/deployment-*.md` / versioned production reports are archived pointers only — use the enterprise docs above.
