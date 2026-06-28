# Billing, Usage & Subscription Platform

Phase 4 Sprint 8 extends Auroranexis into a production-ready SaaS billing platform with usage metering, invoice sync, discount validation, proration previews, centralized enforcement, and customer self-service — without modifying authentication, RBAC, AI architecture, workflow/automation engines, Public API, White Label, or Enterprise Connectors.

## Architecture

```
organization_subscriptions (existing Stripe sync)
        ↓
billing/ platform (metering, usage, enforcement, invoices)
        ↓
billing_usage_events + subscription_usage_snapshots
customer_invoices + billing_events + discount_codes
        ↓
/settings/billing + /settings/usage + Diagnostics
        ↓
Stripe Checkout / Customer Portal / Webhooks (existing integration)
```

### Module layout (`src/lib/billing/`)

| File | Purpose |
|------|---------|
| `types.ts` | Billing overview, usage metrics, invoices, discounts, proration, diagnostics |
| `plans.ts` | Plan catalog and pricing (existing) |
| `subscriptions.ts` | Re-exports subscription queries and Stripe sync helpers |
| `queries.ts` | Billing overview and dashboard data |
| `usage.ts` | Usage aggregation, trends, forecasts |
| `metering.ts` | Usage limits, event recording, period bounds |
| `enforcement.ts` | Central limit checks + in-app billing notifications |
| `invoices.ts` | Stripe invoice sync, billing event audit log |
| `discounts.ts` | Coupon validation and preview |
| `proration.ts` | Mid-cycle upgrade/downgrade cost preview |
| `taxes.ts` | VAT helpers for checkout previews |
| `checkout.ts` | Checkout with optional discount validation |
| `customer-portal.ts` | Stripe Customer Portal wrapper |
| `diagnostics.ts` | Billing platform diagnostics snapshot |
| `cache.ts` | 60s usage summary cache |
| `validation.ts` | Discount code and usage input validation |
| `actions.ts` | Server actions (checkout, portal, discount, proration) |
| `index.ts` | Public exports |

## Database

Migration: `supabase/migrations/20250624120000_billing_usage_platform_v2.sql`

### New tables

| Table | Purpose |
|-------|---------|
| `billing_usage_events` | Append-only metering events (org-scoped, monthly period) |
| `subscription_usage_snapshots` | Monthly aggregated metrics JSON |
| `customer_invoices` | Stripe invoice mirror with PDF/hosted URLs |
| `discount_codes` | Platform coupon codes (percentage or fixed) |
| `billing_events` | Audit log for subscription and invoice lifecycle |

Existing `organization_subscriptions` is **not modified**.

### RLS

- Usage events, snapshots, invoices: org members SELECT
- Billing events: owner/admin SELECT
- Discount codes: authenticated SELECT for active codes

## Usage metering

Tracked metrics:

- AI generations, AI tokens
- API requests
- Automation and workflow executions
- Connector synchronizations
- Reports generated and published
- Storage (MB via usage events)
- Active users, clients, portal users
- Email sends

Aggregation reads from `billing_usage_events`, `ai_usage_events`, `api_request_logs`, and operational tables. Monthly periods reset on UTC month boundaries.

## Subscription enforcement

`enforcement.ts` centralizes:

- Plan feature checks (delegates to `plans/guards`)
- Seat and client limits (existing guards)
- AI and automation limits (existing modules)
- Usage quota checks with `billing_limit_approaching` / `billing_limit_reached` notifications

No duplicated feature matrix — limits derive from `metering.getUsageLimit()` and `plans/features`.

## Stripe integration

Reuses existing:

- `src/lib/stripe/subscriptions.ts` — Checkout and Customer Portal
- `src/lib/stripe/webhooks.ts` — Extended to sync `customer_invoices`, record `billing_events`, and emit `invoice_paid` / `invoice_failed` notifications

Webhook flow unchanged for subscription lifecycle; invoice handlers now mirror invoices locally.

## UI

| Route | Purpose |
|-------|---------|
| `/settings/billing` | Plan, renewal, limits, invoices, discounts, proration, portal actions |
| `/settings/usage` | Usage cards, trends, forecasts, quota remaining |
| `/settings/diagnostics` | Billing platform section |

## Forecasting

Uses Predictive Intelligence linear projection (`projectLinearForecast`, `percentChange`) to estimate end-of-month usage and suggest plan upgrades when overage is likely.

## Security

- Organization isolation on all billing tables
- Stripe secrets never exposed to client
- Server-only billing actions (Owner/Admin)
- Usage validated and recorded server-side only
- Billing event audit trail for subscription changes

## Future roadmap

- Stripe promotion code sync with `discount_codes`
- Real-time usage streaming and snapshot cron
- Storage metering from object storage
- Tax jurisdiction configuration
- Self-serve downgrade with proration settlement
