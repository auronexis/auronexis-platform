# Staging Checklist

> **Superseded for go-live** by [enterprise-release-checklist.md](./enterprise-release-checklist.md) and [enterprise-deployment.md](./enterprise-deployment.md).

**Billing:** FastSpring-only (`/api/fastspring/webhook`). Stripe and legacy Paddle webhook endpoints are historical archive only.

## Current staging gates (summary)

- [ ] Migrations applied in timestamp order
- [ ] FastSpring test storefront keys + webhook registered
- [ ] `CRON_SECRET` set; `/api/cron/run` authorized
- [ ] Queue worker / webhook retries healthy
- [ ] `/api/ready` and `/api/health` green
- [ ] Auth + portal smoke
- [ ] `npm run test:enterprise-regression` green locally/CI

Archive tables such as `stripe_webhook_events` and `paddle_webhook_events` may still exist for historical records — they are not the active billing path.
