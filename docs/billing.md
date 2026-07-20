# Billing, Usage & Subscription Platform

> **Canonical billing:** [paddle-billing.md](./paddle-billing.md)  
> **Ops:** [enterprise-deployment.md](./enterprise-deployment.md) · Build Bible Chapter 12

Auroranexis billing is **Paddle-only**. Historical Stripe tables/columns may remain for archive/diagnostics; they do not drive checkout, portal, or entitlements.

## Architecture

```
organization_subscriptions (Paddle sync)
        ↓
billing/ platform (metering, usage, enforcement, history)
        ↓
billing_usage_events + subscription_usage_snapshots
billing_events + discount_codes
        ↓
/settings/billing + /settings/usage + Diagnostics
        ↓
Paddle Checkout / Customer Portal / Webhooks (/api/paddle/webhook)
```

### Module layout (`src/lib/billing/`)

| Concern | Location |
|---------|----------|
| Types & overview | `types.ts`, `queries.ts` |
| Plans & pricing | `plans.ts`, `plans.server.ts` (Stripe resolvers retired stubs) |
| Paddle sync / checkout | `src/lib/paddle/*`, `checkout` actions |
| Usage metering | `usage.ts`, `metering.ts`, `enforcement.ts` |
| Invoices / history | Paddle transaction history; Stripe invoice mirror retired |
| Diagnostics | `diagnostics.ts`, Settings → Billing → Diagnostics |

## Related

- [paddle-billing.md](./paddle-billing.md) — sole-provider contracts
- [14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md](./14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md)
- [technical-debt.md](./technical-debt.md) — deferred Stripe-named field renames
