# Paddle Billing Integration

Auroranexis uses **Paddle as the sole active billing provider**. Stripe schema and diagnostic rows may remain as a historical archive only — they never drive checkout, portal, or entitlements.

## Status

- **Active provider:** Paddle (always — `getActiveBillingProvider()` returns `"paddle"`)
- **Archive:** Stripe columns/tables may exist for diagnostics; never selected for new commerce
- `BILLING_PROVIDER` env is ignored for provider selection

## Environment variables (names only)

| Name | Scope | Notes |
|------|-------|-------|
| `PADDLE_API_KEY` | server-only | Never expose to browser |
| `PADDLE_WEBHOOK_SECRET` | server-only | Signature verification |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | browser-safe | Paddle.js token |
| `PADDLE_ENVIRONMENT` | server | Exactly `sandbox` or `production` |
| `PADDLE_PRICE_PROFESSIONAL_MONTHLY` | server | `pri_…` from Paddle |
| `PADDLE_PRICE_BUSINESS_MONTHLY` | server | `pri_…` from Paddle |
| `PADDLE_PRICE_ENTERPRISE_MONTHLY` | server | optional; Enterprise remains quotation-first |
| `GA4_API_SECRET` | server-only | Optional server commercial analytics (Measurement Protocol) |

## Authoritative modules

| Concern | Location |
|---------|----------|
| Checkout payload | `src/lib/paddle/checkout.ts` |
| Webhooks + commercial events | `src/lib/paddle/webhooks.ts`, `src/app/api/paddle/webhook/route.ts` |
| Idempotency | `src/lib/paddle/idempotency.ts` |
| Sync / upsert | `src/lib/paddle/sync.ts` |
| Customer portal | `src/lib/paddle/portal.ts` |
| Entitlements | `src/lib/entitlements/resolver.ts` |
| Plan catalog | `src/lib/billing/plans.ts` |
| Commercial event names | `src/lib/billing/commercial-events.ts` |

## Database migrations

1. `20250717000000_paddle_billing.sql` — Paddle columns, `paddle_webhook_events`, `billing_provider_transactions`
2. `20250718160000_paddle_billing_v2_stripe_archive.sql` — archive views for historical Stripe data

Do not drop archive Stripe columns used by diagnostics.

## Checkout rules

- Public pricing: `/pricing`
- Authenticated checkout: `/settings/plans` (Paddle.js overlay)
- Access is **never** granted from browser success alone — webhook/server reconciliation required
- Duplicate self-serve subscriptions blocked via checkout guards + single subscription row per org

## Customer portal

- `/settings/billing` → Paddle customer portal session (`ctm_` customer required)
- Invoices/PDFs from `billing_provider_transactions` + Paddle invoice PDF API

## Webhooks

- Endpoint: `/api/paddle/webhook`
- Signature required (`paddle-signature`)
- Idempotent via `paddle_webhook_events` (including stale `processing` retry after 5 minutes)
- Commercial analytics emitted after successful process (privacy-safe, no org IDs)

## Entitlements

Single authoritative resolve: `resolveOrganizationEntitlements` — Paddle subscription → price → `PLAN_ENTITLEMENTS`.

## Validation

`npm run test:paddle-billing`, `npm run test:build-bible-ch12`, `npm run lint`, `npm run typecheck`, `npm run build`.
