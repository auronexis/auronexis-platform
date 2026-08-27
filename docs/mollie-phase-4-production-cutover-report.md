# Mollie Phase 4 — Production Cutover Hardening Report

**Date:** 2026-08-21  
**Baseline:** Phase 3 `f730e9d` (+ later auth/email commits on `main`; this phase did not modify auth/email)  
**Scope:** Provider ownership safety, checkout eligibility, duplicate protection, lifecycle accuracy, classic webhook hardening, LIVE/rollback cutover prep  

---

## Verdict

**B — READY FOR CONTROLLED PRODUCTION ROLLOUT (TEST / allowlist)**  
Not LIVE. `MOLLIE_LIVE_CHARGING_ENABLED` remains false/unset. Global FastSpring default unchanged. No mass migration.

---

## Architecture audit (pre-edit facts)

| Area | Fact |
|------|------|
| Global provider | `getActiveBillingProvider()` → `"fastspring"` always |
| Per-org resolution | `resolveOrganizationBillingProvider` / alias `resolveBillingProviderForOrganization` |
| Mollie stack | `src/lib/billing/providers/mollie/**` + `POST /api/mollie/webhook` |
| Canonical row | `organization_subscriptions` (`billing_provider`, `provider_*`) |
| FastSpring IDs | Same generic columns; `billing_provider = "fastspring"` |
| Pricing | `SUBSCRIPTION_PLANS` — Professional $179, Business $599, Enterprise $1799 (unchanged) |
| Phase 2 harness | `/settings/billing/mollie-test` + `mollie_test_subscriptions` preserved |

---

## What Phase 4 changed

1. **Ownership vs eligibility vs default** — `resolveBillingProviderOwnership` + clearer resolution reasons; rollout never overwrites ownership.
2. **Central checkout eligibility** — `src/lib/billing/checkout-eligibility.ts` (`provider_conflict`, `existing_subscription`, `duplicate_mollie`, plan-change path).
3. **Duplicate purchase protection** — reuse open Mollie first payments; refuse second `sub_` for active/suspended.
4. **Customer reuse** — `cst_` from `organization_subscriptions` (ownership survives allowlist rollback).
5. **Lifecycle status map** — `lifecycle-status.ts` (pending→incomplete, suspended→past_due, failed/expired mapped; cancel-at-period-end / reactivation explicitly unsupported).
6. **Plan change** — in-place Mollie amount update; never cancel+create.
7. **Cancel** — immediate API cancel only; `canceledAtPeriodEnd: false`.
8. **LIVE kill switch** — independent from `MOLLIE_BILLING_ROLLOUT`; webhook/route uses `isMollieLiveChargingEnabled()`.
9. **NEW-sub cutover prep** — `MOLLIE_BILLING_DEFAULT_FOR_NEW` (default false); requires rollout; does not migrate FastSpring owners.
10. **Rollback** — disable NEW Mollie via rollout/allowlist/default flags; Mollie-owned orgs stay Mollie.

## Database

**No migration.** Additive env docs only. RLS unchanged.

## Classic webhook (operator)

**Per-resource architecture:** payment and subscription creates set `webhookUrl` via `buildMollieWebhookUrl()`.

Production callback:

`https://app.auroranexis.com/api/mollie/webhook`

(`NEXT_PUBLIC_APP_URL` **must** be `https://app.auroranexis.com`. **DASHBOARD_WEBHOOK_REQUIRED = NO**. Do **not** create Next-Gen Dashboard / `X-Mollie-Signature` webhooks against the classic endpoint.)

Body supplies payment id (`tr_*`); server re-fetches Payment (+ Subscription) from Mollie API; `mollie_webhook_events` idempotency ledger handles replay.

## Operator actions (explicit)

1. Confirm `NEXT_PUBLIC_APP_URL=https://app.auroranexis.com` so per-resource `webhookUrl` matches production.
2. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until explicit LIVE go-live approval.
3. For controlled TEST/production-style rollout: `MOLLIE_BILLING_ROLLOUT=true` + org UUID(s) in `MOLLIE_BILLING_ORG_ALLOWLIST`.
4. Leave `MOLLIE_BILLING_DEFAULT_FOR_NEW=false` until ready for NEW-subscription global cutover.
5. Do not migrate or cancel FastSpring remotes.
6. Do not enable LIVE keys for payment writes without the LIVE kill switch.
7. Do not block go-live on Mollie Dashboard webhook registration.

## Rollback

1. Set `MOLLIE_BILLING_ROLLOUT=false` (and/or clear allowlist / `MOLLIE_BILLING_DEFAULT_FOR_NEW`).
2. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false`.
3. Existing Mollie `organization_subscriptions` rows remain Mollie-owned (no rewrite).
4. FastSpring orgs unchanged.

## Global cutover readiness (NEW subs only)

| Question | Answer |
|----------|--------|
| Ready for NEW Mollie on allowlist (TEST)? | **YES** |
| Ready for `MOLLIE_BILLING_DEFAULT_FOR_NEW`? | **NO** (prep only; flag default false) |
| Ready for LIVE charging? | **NO** |
| Ready for mass FastSpring→Mollie migration? | **NO** (out of scope; not implemented) |

## Tests

- `npm run test:mollie-billing` (Phases 2–4)
- Focused FastSpring + lint + typecheck + production build (see commit gates)

## Security checklist

- [x] No secrets in client / no `NEXT_PUBLIC_MOLLIE_*`
- [x] Service-role not imported in Client Components
- [x] Webhook never trusts body without API re-fetch
- [x] Return page never grants entitlements
- [x] RLS not weakened
- [x] LIVE kill switch default off
- [x] Auth / signup / SMTP / password-reset untouched
