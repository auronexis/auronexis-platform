# Mollie Phase 4.1 — Upgrade Checkout Forensic

**Date:** 2026-08-23  
**Scope:** Professional → Business immediate paid upgrade checkout failure (“Unable to start checkout.”)  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## FINAL VERDICT

**A — FIXED AND READY FOR TEST**

Root cause remediated in code: in-flight `upgrade_payment_id` no longer hard-blocks checkout before reuse/clear; upgrade domain errors are sanitized to specific customer copy instead of collapsing to “Unable to start checkout.”; recovered active Professional subscriptions can refresh period bounds from Mollie when local bounds are missing. No new migration. FastSpring unchanged. LIVE kill switch unchanged.

**Not LIVE-ready.** Do not set `MOLLIE_LIVE_CHARGING_ENABLED=true`.

---

## A. Incident summary

| Signal | Observed |
|--------|----------|
| Org | `df827f64-84b7-42e1-91a7-9420febcf843` |
| Plan / status | Professional / active / Mollie / Paid |
| Recovery | Already succeeded (V3) |
| UI | Plans: Professional = Current, Business = Upgrade |
| Click Upgrade | No Mollie hosted checkout |
| Customer message | **Unable to start checkout.** |

## B. End-to-end trace

1. `/settings/plans` → `PricingGrid.selectPlan("business")`
2. `createCheckoutSessionAction` (`actions.ts`)
3. `getOrganizationBillingProvider` → `mollie`
4. `resolveCheckoutEligibility` → `allowed_mollie_plan_change`
5. `createMollieUpgradePaymentCheckout` (`upgrade-payment.ts`)
6. Guards: `sub_`, `cst_`, no cancel, no `pending_plan`
7. **Defect site:** `upgrade_payment_id` hard-throw **before** open-payment reuse
8. Proration / Mollie `customerPayments.create` / checkout URL / persist attempt
9. Webhook `reconcileMollieUpgradePayment` → `applyMollieUpgradeAfterPayment`
10. Email `sendUpgradeActivatedEmail` (ledger once)
11. Billing history via `recordMolliePaidTransaction`

## C. Exact root cause

**Function:** `createMollieUpgradePaymentCheckout`  
**Condition (pre-fix):**

```ts
if (existing.upgrade_payment_id) {
  throw new Error(
    "An upgrade payment is already in progress. Complete or wait for it to expire before retrying.",
  );
}
```

This ran **before** `findReusableOpenUpgradePayment`, so any prior upgrade attempt (abandoned checkout, expired `tr_`, double-click) permanently blocked Upgrade for recovered/active Mollie orgs.

**UI collapse function:** `sanitizeBillingCustomerError(..., "Unable to start checkout.")` in `actions.ts` catch + re-sanitize in `pricing-grid.tsx`.  
`resolvePlanChangeCustomerError` did **not** map upgrade-in-progress / period / provider failures → every upgrade domain throw became the generic fallback.

## D. Why previous tests missed it

1. Phase 4.1 Recovery V2/V3 suites asserted upgrade wiring exists (`createMollieUpgradePaymentCheckout`, proration symbols) but **never exercised** the `upgrade_payment_id` hard-throw vs reuse ordering.
2. No assertion that upgrade errors survive `sanitizeBillingCustomerError` (source of the exact UI string).
3. No recovered-org path covering stale in-flight upgrade attempt after successful purchase recovery.
4. Tests are source-contract only — no runtime simulation of tracked `tr_` pending/expired/paid.

## E. Expected behavior (confirmed)

1. Professional remains authoritative (`provider_price_id`) until paid webhook apply  
2. Proration: `(Business − Professional) × (remaining ÷ total)` in minor units  
3. Redirect to Mollie hosted checkout (`SequenceType.oneoff`)  
4. Return page does **not** grant Business  
5. Paid webhook: update same `sub_`, flip to Business, clear attempt, transaction, one email  
6. Not free / not schedule-only / not silent flip / not return-page activation  

## F. Fix summary

| Change | Purpose |
|--------|---------|
| `resolveOpenUpgradePaymentCheckout` | Reuse open `tr_`, clear terminal, refuse paid-awaiting-sync |
| `resolveUpgradePeriodBounds` | Refresh bounds from Mollie when missing (recovered orgs) |
| `upgrade-proration.ts` | Pure formula + date-only boundary normalization |
| `errors.ts` / `plan-change.ts` messages | Specific sanitized upgrade copy |
| Return page `purpose=upgrade` | Explicit non-entitlement messaging |
| Structured logs | `upgrade_validate` … `upgrade_email` |
| `ORGANIZATION_SUBSCRIPTION_SELECT` | Include upgrade attempt columns |

## G. Upgrade pricing formula

```
net_due_cents = max(0, round(
  (target_price_cents - previous_price_cents)
  * remaining_ms / total_period_ms
))
```

Catalog: Professional `$179` → Business `$599` (USD minor units).  
Fails closed when period bounds unavailable/invalid or `net_due_cents <= 0`.

## H. Migration

**NO** — no new migration. Schema already has `upgrade_payment_id` / `upgrade_target_plan` from `20250822020000_mollie_upgrade_payment_attempt.sql`.

Operators must ensure that migration is applied on the target Supabase project (already required by Recovery V2).

## I. Files changed

- `src/lib/billing/providers/mollie/upgrade-payment.ts`
- `src/lib/billing/providers/mollie/upgrade-proration.ts` (new)
- `src/lib/billing/errors.ts`
- `src/lib/billing/plan-change.ts`
- `src/lib/billing/queries.ts`
- `src/lib/billing/providers/mollie/webhooks.ts`
- `src/app/(dashboard)/settings/billing/mollie/return/page.tsx`
- `scripts/mollie-billing-phase4-1-upgrade-checkout.test.mjs` (new)
- `package.json`
- `docs/mollie-phase-4-1-upgrade-checkout-forensic.md` (this file)

## J. Automated test summary

Suite: `scripts/mollie-billing-phase4-1-upgrade-checkout.test.mjs` (wired into `npm run test:mollie-billing`)

Covers requirements 1–15 plus sanitizer mapping, structured logs, docs, and no-new-migration checks.

## K. Constraints preserved

- `MOLLIE_LIVE_CHARGING_ENABLED` remains false  
- `recoverMolliePaidFreshPurchase` untouched  
- No auto-cancel / auto-refund / free Business / schedule-only upgrade  
- FastSpring global default unchanged  
- Duplicate purchase / customer / `sub_` protections preserved  
- Return page never grants entitlements  

## L. Manual operator TEST steps (TEST keys)

1. Confirm org is Professional / active / Mollie / Paid with `sub_` + `cst_`.  
2. Confirm `upgrade_payment_id` is null **or** expect reuse of open checkout after this fix.  
3. `/settings/plans` → Business → **Upgrade**.  
4. Expect redirect to Mollie hosted checkout with prorated amount (not full $599).  
5. Complete TEST payment → webhook → Business active; one `upgrade_activated` email; billing history row.  
6. Repeat Upgrade click on open payment → reuse same checkout URL (no second charge).  
7. Cancel/expire an upgrade payment → Professional remains; retry creates a new checkout.  
8. Visit return URL with `purpose=upgrade` alone → Professional remains; no Business from query params.  
9. Confirm FastSpring orgs unaffected; `MOLLIE_LIVE_CHARGING_ENABLED=false`.

## M. Residual risks

1. If `20250822020000_mollie_upgrade_payment_attempt.sql` was never applied, upgrade SELECT/persist still fails until operator applies it.  
2. Mollie provider outages surface as “Upgrade checkout is temporarily unavailable.”  
3. Extreme clock skew / missing Mollie `nextPaymentDate` still fails closed on proration.  
4. Paid-but-unapplied upgrade still requires webhook/ops attention (`UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE`).  

## N. LIVE charging

**Unchanged / disabled.** TEST credentials remain allowed for upgrade checkout ops.

## O. Recovery V2/V3 invariants

Preserved: stale `sub_` handling, webhook postconditions, operator recovery path, upgrade purpose routing, no entitlement from return page.

## P. Self-audit

| Check | Result |
|-------|--------|
| Forensic before code change | Yes |
| Minimal fix for proven root cause | Yes |
| No LIVE enablement | Yes |
| No recovery-logic edits | Yes |
| No FastSpring behavior change | Yes |
| No new migration | Yes |
| Automated coverage 1–15 | Yes |
| Docs A–P | Yes |
