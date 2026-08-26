# Staging Checklist

> **Superseded for go-live** by [enterprise-release-checklist.md](./enterprise-release-checklist.md) and [enterprise-deployment.md](./enterprise-deployment.md).

**Billing:** Mollie only (sole active PSP). Stripe / Paddle / FastSpring are historical archive only. See [enterprise-deployment.md](./enterprise-deployment.md).

## Current staging gates (summary)

- [ ] Migrations applied in timestamp order
- [ ] Mollie TEST API key + classic webhook `/api/mollie/webhook` registered (`MOLLIE_LIVE_CHARGING_ENABLED=false`)
- [ ] `CRON_SECRET` set; `/api/cron/run` authorized
- [ ] Queue worker / webhook retries healthy
- [ ] `/api/ready` and `/api/health` green
- [ ] Auth + portal smoke
- [ ] `npm run test:enterprise-regression` green locally/CI

Archive tables such as `stripe_webhook_events`, `paddle_webhook_events`, and `fastspring_webhook_events` may still exist for historical records — they are not the active billing path.
