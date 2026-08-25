# Billing Integration (HISTORICAL — FastSpring / Paddle era)

> **STATUS: HISTORICAL / SUPERSEDED**
> **CURRENT BILLING PROVIDER: MOLLIE**
> **DO NOT USE THIS DOCUMENT FOR CURRENT PRODUCTION OPERATIONS**
> Canonical ops: [billing.md](./billing.md) · [enterprise-deployment.md](./enterprise-deployment.md) · [enterprise-production-golive-playbook.md](./enterprise-production-golive-playbook.md)

This file is retained as **audit evidence** of the pre-Mollie FastSpring/Paddle billing era. Runtime code now returns `getActiveBillingProvider() → "mollie"`. FastSpring API routes return **410 Gone**. Stripe/Paddle runtimes are removed.

---

## Historical status (do not follow)

The following statements were true during the FastSpring sole-provider cutover and are **no longer operational guidance**:

- FastSpring was briefly treated as sole active provider and Merchant of Record
- Paddle and Stripe schema/diagnostic rows remained as historical archive
- `BILLING_PROVIDER` env was ignored for provider selection
- Paddle runtime (SDKs, `/api/paddle/webhook`, `src/lib/paddle/**`) was removed

## Historical environment variables (retired — remove from Vercel)

| Name | Scope | Notes |
|------|-------|-------|
| `FASTSPRING_WEBHOOK_SECRET` | server-only | Retired |
| `FASTSPRING_API_USERNAME` | server-only | Retired |
| `FASTSPRING_API_PASSWORD` | server-only | Retired |
| `FASTSPRING_STOREFRONT` | server-only | Retired |
| `FASTSPRING_STORE_ID` | server-only | Retired |

## Historical modules (dead / 410)

| Concern | Historical location | Current state |
|---------|---------------------|---------------|
| Checkout payload | `src/lib/fastspring/checkout.ts` | Dead code — not mounted |
| Webhooks | `src/app/api/fastspring/webhook/route.ts` | **410 Gone** |
| Connectivity | `src/app/api/fastspring/connectivity/route.ts` | **410 Gone** |
| Sync / upsert | `src/lib/fastspring/sync.ts` | Archive read-only |
| Active checkout / webhooks | — | `src/lib/billing/providers/mollie/**`, `/api/mollie/webhook` |
| Entitlements | `src/lib/entitlements/resolver.ts` | Mollie-aware (unchanged authority) |

## Database migrations (historical — do not rewrite)

1. `20250717000000_paddle_billing.sql` — historical Paddle columns
2. `20250718160000_paddle_billing_v2_stripe_archive.sql` — Stripe archive views
3. `20250726120000_fastspring_webhook_foundation.sql` — FastSpring webhook foundation

Do not drop archive Stripe/Paddle/FastSpring columns used by diagnostics.

## Current validation

```bash
npm run test:mollie-billing
npm run test:legacy-billing-removal
npm run test:build-bible-ch12
```
