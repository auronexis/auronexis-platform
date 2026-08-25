# Billing, Usage & Subscription Platform

> **Canonical billing:** Mollie sole PSP (`src/lib/billing/providers/mollie/**`)
> **Ops:** [enterprise-deployment.md](./enterprise-deployment.md) · [enterprise-production-golive-playbook.md](./enterprise-production-golive-playbook.md)
> **Historical:** [paddle-billing.md](./paddle-billing.md) (SUPERSEDED — do not use for production ops)

Auroranexis billing is **Mollie-only** for active checkout, portal, webhooks, and entitlements. Auroranexis is the seller (not Mollie Merchant of Record). Historical Stripe, Paddle, and FastSpring tables/columns may remain for archive/diagnostics; they do not drive active customer billing.

## Architecture

```
organization_subscriptions (Mollie sync)
        ↓
billing/ platform (metering, usage, enforcement, history, sales invoices)
        ↓
billing_usage_events + subscription_usage_snapshots
billing_events + discount_codes + sales_invoices
        ↓
/settings/billing + /settings/usage + Diagnostics
        ↓
Mollie Checkout / Webhooks (/api/mollie/webhook)
```

### Module layout (`src/lib/billing/`)

| Concern | Location |
|---------|----------|
| Types & overview | `types.ts`, `queries.ts` |
| Plans & pricing | `plans.ts`, `price-catalog.ts`, `catalog.ts`, `display-pricing.ts` |
| Mollie sync / checkout | `providers/mollie/*`, checkout actions |
| Tax / VAT boundaries | `tax-policy.ts`, `taxes.ts`, `vies.ts` |
| Sales invoices | `sales-invoice.ts`, `e-invoice.ts` (generator deferred) |
| Usage metering | `usage.ts`, `metering.ts`, `enforcement.ts` |
| Diagnostics | `diagnostics.ts`, Settings → Billing → Diagnostics |

## Related

- [enterprise-deployment.md](./enterprise-deployment.md)
- [14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md](./14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md) — historical title; FastSpring/Paddle retired
- [technical-debt.md](./technical-debt.md) — deferred Stripe-named field renames
- [p1-002-remediation-pricing-tax-invoice-contracting.md](./p1-002-remediation-pricing-tax-invoice-contracting.md)
