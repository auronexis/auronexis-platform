# Mollie Provider Consolidation — Final Report

**Date:** 2026-08-23  
**Status:** FastSpring retired from active runtime; Mollie is the sole active billing provider  
**LIVE charging:** remains gated (`MOLLIE_LIVE_CHARGING_ENABLED=false` by default)

## Incident root cause

Production `/settings/plans` called FastSpring Price API via:

1. `src/app/(dashboard)/settings/plans/page.tsx`
2. → `resolveRequestBillingCountry` (`src/lib/fastspring/country.ts`)
3. → `getPublicLocalizedPrices` (`src/lib/fastspring/localized-pricing.ts`)
4. → `fastSpringApiFetch` → `https://api.fastspring.com/products/.../price`

That produced `[fastspring][pricing] product price request failed` (HTTP 404 for professional/business/enterprise).

**Fix:** Plans and public pricing now use catalog USD display via `src/lib/billing/display-pricing.ts` (`getCatalogDisplayPriceMap` / `getCatalogDisplayPrices`). Zero FastSpring network calls on these surfaces.

## Architecture after cleanup

| Concern | Behavior |
|---------|----------|
| Global provider | `getActiveBillingProvider()` → `"mollie"` |
| New checkout | Mollie first payment / upgrade / downgrade / cancel / keep |
| Display prices | Canonical catalog USD (`fallbackMonthlyUsd` / `priceMonthly`) |
| Historical FastSpring rows | Ownership detection retained; blocks silent Mollie double-billing |
| FastSpring checkout | Removed from actions + pricing grid |
| FastSpring webhooks | `/api/fastspring/webhook` → **410 Gone** |
| FastSpring connectivity | `/api/fastspring/connectivity` → **410 Gone** |
| Mollie webhooks | `/api/mollie/webhook` remains authoritative |
| LIVE charges | Still require `MOLLIE_LIVE_CHARGING_ENABLED=true` |

## Env classification

| Variable | Classification |
|----------|----------------|
| `FASTSPRING_WEBHOOK_SECRET` | **REMOVE NOW** from Vercel (runtime unused; webhook returns 410) |
| `FASTSPRING_API_USERNAME` | **REMOVE NOW** from Vercel |
| `FASTSPRING_API_PASSWORD` | **REMOVE NOW** from Vercel |
| `FASTSPRING_STOREFRONT` | **REMOVE NOW** from Vercel |
| `FASTSPRING_STORE_ID` | **REMOVE NOW** from Vercel |
| Commented stubs in `.env.example` | **LEGACY** documentation only |

Also ensure production has:

- `MOLLIE_API_KEY` (test_ until LIVE approval)
- `MOLLIE_BILLING_ROLLOUT=true`
- `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit go-live

## Routes retired

- `POST/GET /api/fastspring/webhook` → 410
- `GET /api/fastspring/connectivity` → 410
- `/settings/billing/fastspring-test` → redirects to Mollie test surface
- CSP / `vercel.json`: removed `*.onfastspring.com` / `sbl.onfastspring.com`

## Data preservation

- No destructive purge of FastSpring financial DB rows
- `billing_provider = 'fastspring'` remains valid on historical `organization_subscriptions`
- `fastspring_webhook_events` table / migrations retained
- Archive modules under `src/lib/fastspring/**` remain for historical sync/guards but are not called from active checkout/pricing

## Refunds / legal

- Removed FastSpring MoR / buyer-support wording from customer-facing legal/FAQ/SEO
- **Did not invent** a money-back guarantee or self-service refund UI
- Cancellation remains distinct from refund
- Operator path: support review → if approved, refund via Mollie Dashboard / API (operator)
- Marked **LEGAL_REVIEW_REQUIRED** for Merchant of Record / tax remittance role under Mollie

## Tests

| Suite | Change |
|-------|--------|
| `scripts/mollie-sole-provider.test.mjs` | **Added** — sole-provider proofs |
| `test:mollie-billing` | Includes sole-provider + lifecycle suites |
| `test:fastspring-*` | Redirected to `mollie-sole-provider` (obsolete FS suites superseded) |
| Mollie phase tests | Updated provider expectations to Mollie |

Obsolete FastSpring-specific suites (`fastspring-*.test.mjs`) are superseded and no longer required for CI green; keep files only as historical references until deleted in a follow-up cleanup.

## Manual operator actions

1. Remove `FASTSPRING_*` from Vercel Production / Preview / Development
2. Disable FastSpring storefront webhooks pointing at Auroranexis
3. Confirm `MOLLIE_BILLING_ROLLOUT=true` and per-resource Mollie `webhookUrl` → `/api/mollie/webhook` (`NEXT_PUBLIC_APP_URL` on app host; Dashboard registration not required)
4. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until LIVE approval
5. Legal counsel review of MoR / tax wording (`LEGAL_REVIEW_REQUIRED`)
6. Support runbook: operator Mollie refunds for approved billing-error cases

## Superseded docs

Treat prior FastSpring-as-sole-provider architecture statements as historical, including:

- `docs/paddle-billing.md` (FastSpring-era narrative)
- `docs/14_BUILD_BIBLE_V2_CHAPTER_12_PADDLE_BILLING.md`
- Phase-4 coexistence reports that still say `getActiveBillingProvider() → fastspring`
- Cursor rules under `.cursor/rules/build-bible-v2-ch12-paddle-billing.mdc` (still mention FastSpring sole provider — update in a follow-up rule pass)

This file is the consolidation source of truth going forward.
