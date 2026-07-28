# Billing Integration (FastSpring — sole active provider)

Auroranexis uses **FastSpring as the sole active billing provider** (Merchant of Record). Paddle and Stripe schema/diagnostic rows remain as historical archive only — neither ever drives checkout, portal, or entitlements.

## Status

- **Active provider:** FastSpring (always — `getActiveBillingProvider()` returns `"fastspring"`)
- **Archive:** Paddle and Stripe columns/tables may exist for diagnostics and historical entitlement lookups; never selected for new commerce
- `BILLING_PROVIDER` env is ignored for provider selection
- Production has 0 usable Paddle subscriptions — the Paddle runtime (SDKs, `/api/paddle/webhook`, `src/lib/paddle/**`) has been fully removed

## Environment variables (names only)

| Name | Scope | Notes |
|------|-------|-------|
| `FASTSPRING_WEBHOOK_SECRET` | server-only | HMAC-SHA256 signature verification |
| `FASTSPRING_API_USERNAME` | server-only | FastSpring REST API |
| `FASTSPRING_API_PASSWORD` | server-only | FastSpring REST API |
| `FASTSPRING_STOREFRONT` | server-only | Live production `data-storefront` value |
| `FASTSPRING_STORE_ID` | server-only | Test-only fallback storefront builder |
| `GA4_API_SECRET` | server-only | Optional server commercial analytics (Measurement Protocol) |

## Authoritative modules

| Concern | Location |
|---------|----------|
| Checkout payload | `src/lib/fastspring/checkout.ts` |
| Webhooks + commercial events | `src/lib/fastspring/webhooks.ts`, `src/app/api/fastspring/webhook/route.ts` |
| Idempotency | `src/lib/fastspring/idempotency.ts` |
| Sync / upsert | `src/lib/fastspring/sync.ts` |
| Customer portal | `src/lib/billing/customer-portal.ts` (fails closed — FastSpring has no hosted portal) |
| Entitlements | `src/lib/entitlements/resolver.ts` |
| Plan catalog | `src/lib/billing/catalog.ts`, `src/lib/billing/plans.ts` |
| Commercial event names | `src/lib/billing/commercial-events.ts` |

## Database migrations

1. `20250717000000_paddle_billing.sql` — historical Paddle columns, `paddle_webhook_events`, `billing_provider_transactions`
2. `20250718160000_paddle_billing_v2_stripe_archive.sql` — archive views for historical Stripe data
3. `20250726120000_fastspring_webhook_foundation.sql` — `fastspring_webhook_events`, FastSpring provider columns

Do not drop archive Stripe or Paddle columns used by diagnostics.

## Checkout rules

- Public pricing: `/pricing`
- Authenticated checkout: `/settings/plans` (FastSpring Store Builder popup)
- Access is **never** granted from browser success alone — webhook/server reconciliation required
- Duplicate self-serve subscriptions blocked via checkout guards + single subscription row per org

## Customer portal

- FastSpring does not expose a hosted customer portal in this integration
- `/settings/billing` shows a customer-safe message; subscription changes go through FastSpring purchase emails or support
- Historical Paddle rows may still show a legacy Paddle portal link (`ctm_` customer required) for archive/reference only

## Webhooks

- Endpoint: `/api/fastspring/webhook`
- Signature required (`X-FS-Signature`, HMAC-SHA256 base64 of the raw body)
- Idempotent via `fastspring_webhook_events` (including stale `processing` retry after 5 minutes)
- Commercial analytics emitted after successful process (privacy-safe, no org IDs)

## Entitlements

Single authoritative resolve: `resolveOrganizationEntitlements` — FastSpring subscription → product path → `PLAN_ENTITLEMENTS`. Usable legacy Paddle subscriptions remain entitled but never receive new checkout or portal access.

## Validation

`npm run test:fastspring-billing`, `npm run test:build-bible-ch12`, `npm run lint`, `npm run typecheck`, `npm run build`.
