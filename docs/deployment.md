# Deployment Guide

> **Canonical guide:** [enterprise-deployment.md](./enterprise-deployment.md)  
> **Checklist:** [enterprise-release-checklist.md](./enterprise-release-checklist.md)  
> **Rollback:** [rollback-plan.md](./rollback-plan.md)  
> **Build Bible:** [16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md](./16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md)

This file is retained as a stable entry point. Stripe-era, Paddle-era, and FastSpring-era instructions previously here are **obsolete / HISTORICAL**. Auroranexis billing is **Mollie-only** (PSP; Auroranexis remains the seller).

## Quick path

```bash
npm ci
npm run lint
npm run typecheck
npm run test:production-readiness
npm run test:enterprise-regression
npm run build
```

Configure secrets from `.env.example` (Mollie-first). Never commit real secrets. Never set `TURNSTILE_DISABLE` or `E2E_DISABLE_RATE_LIMIT` in production.

Webhook endpoint:

```text
https://www.auroranexis.com/api/mollie/webhook
```

(`https://www.auroranexis.com/api/fastspring/webhook` remains **410 Gone** — HISTORICAL only.)

Cron: Vercel hits `GET /api/cron/run` every 5 minutes with `Authorization: Bearer $CRON_SECRET` (requires `CRON_SECRET` in Production).
