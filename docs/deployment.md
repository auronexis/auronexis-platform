# Deployment Guide

> **Canonical guide:** [enterprise-deployment.md](./enterprise-deployment.md)  
> **Checklist:** [enterprise-release-checklist.md](./enterprise-release-checklist.md)  
> **Rollback:** [rollback-plan.md](./rollback-plan.md)  
> **Build Bible:** [16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md](./16_BUILD_BIBLE_V2_CHAPTER_14_PRODUCTION_READINESS.md)

This file is retained as a stable entry point. Stripe-era instructions previously here are **obsolete**. Auroranexis billing is **Paddle-only**.

## Quick path

```bash
npm ci
npm run lint
npm run typecheck
npm run test:production-readiness
npm run test:enterprise-regression
npm run build
```

Configure secrets from `.env.example` (Paddle-first). Never commit real secrets. Never set `TURNSTILE_DISABLE` or `E2E_DISABLE_RATE_LIMIT` in production.

Webhook endpoint:

```text
https://www.auroranexis.com/api/paddle/webhook
```

Cron: Vercel hits `POST /api/cron/run` every 5 minutes with `Authorization: Bearer $CRON_SECRET`.
