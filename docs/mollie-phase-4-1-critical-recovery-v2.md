# Mollie Phase 4.1 Critical Recovery V2

**Date:** 2026-08-22  
**Scope:** Remediate revoked Phase 4.1 acceptance — purchase, upgrade, cancellation lifecycle defects  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## FINAL VERDICT

**A — READY FOR CONTROLLED TEST / ALLOWLIST ROLLOUT AFTER OPERATOR APPLIES MIGRATION**

Runtime defects A/B/C/D remediated in lifecycle code (not UI-only patches). Upgrades require prorated Mollie payment before Business activation. Cancellation preserves paid-through access and emails. Initial purchase writes billing history + `purchase_activated` email.

**Not LIVE-ready.** Do not set `MOLLIE_LIVE_CHARGING_ENABLED=true`.

---

## A. Root cause map — writers

| Writer | Role |
|--------|------|
| `upgrade-payment.ts` | Prorated upgrade payment (`tr_` oneoff) |
| `lifecycle.ts` | Downgrade schedule, upgrade apply, cancel, expire |
| `organization-sync.ts` | Canonical `organization_subscriptions` upsert |
| `webhooks.ts` | Payment routing: initial_purchase, upgrade_adjustment, renewal |
| `transactions.ts` | `billing_provider_transactions` for Mollie |
| `production-checkout.ts` | First payment + subscription create |
| `actions.ts` | Checkout orchestration + emails |

## B. Root cause map — readers

| Reader | Role |
|--------|------|
| `resolveSubscriptionUsability` | Paid-through cancel semantics |
| `resolveSubscriptionManagementState` | Status labels, cancel UI |
| `buildBillingOverview` | Settings/plans UI |
| `resolveCheckoutEligibility` | Plan change vs subscribe |
| `resolveOrganizationEntitlements` | Feature access |

## C. DEFECT A — Upgrade incorrect (FIXED)

**Root cause:** `changeMollieOrganizationPlan` scheduled all changes for next cycle via `customerSubscriptions.update` — no proration payment path.

**Fix:**
1. `createMollieUpgradePaymentCheckout` — proration + dedicated `SequenceType.oneoff` payment
2. `applyMollieUpgradeAfterPayment` — flips `provider_price_id` only after paid webhook
3. `upgrade_payment_id` / `upgrade_target_plan` track in-flight attempts
4. UI returns Mollie checkout URL with prorated amount message

## D. DEFECT B — Cancellation incorrect (FIXED)

**Root cause:** Split readers — `hasActiveMollieSubscription` used raw `provider_status=canceled`; `organizations.plan` flipped to free during paid-through; management panel hidden when `!isUsable`.

**Fix:**
1. `hasActiveMollieSubscription` → `resolveSubscriptionUsability`
2. `resolveOrganizationPlanFlag` keeps `paid` during paid-through
3. `getBillingProviderDetails` uses management state labels
4. `BillingMollieManagementPanel` shows when `cancelAtPeriodEnd && isPaidThrough`
5. Cancel captures `current_period_end` from Mollie subscription when missing locally

## E. DEFECT C — Cancellation email missing (FIXED)

**Root cause:** `cancelMollieSubscriptionAction` used acting session email (often empty/wrong) instead of owner/admin billing recipient.

**Fix:** `resolvePrimaryBillingRecipientForEmail` + `sendSubscriptionCancellationScheduledEmail` with ledger idempotency (`subscription_cancellation_scheduled:{sub_id}:{access_until}`).

## F. GAP D — Purchase communication incomplete (FIXED)

**Root cause:** No Mollie writers for `billing_provider_transactions` or purchase email on first-payment webhook.

**Fix:**
1. `recordMolliePaidTransaction` on initial purchase + renewal + upgrade
2. `sendPurchaseActivatedEmail` (`purchase_activated:{sub_id}:{payment_id}`)
3. Receipt link when Mollie checkout href available; truthful fallback copy otherwise

## G. Canonical events (unchanged names)

`INITIAL_PURCHASE`, `PURCHASE_PAYMENT_CONFIRMED`, `UPGRADE_REQUESTED`, `UPGRADE_PAYMENT_CONFIRMED`, `DOWNGRADE_SCHEDULED`, `DOWNGRADE_CANCELED`, `DOWNGRADE_APPLIED`, `SUBSCRIPTION_CANCELLATION_REQUESTED`, `SUBSCRIPTION_ACCESS_ENDED`, `RENEWAL_PAYMENT_SUCCEEDED`, `RENEWAL_PAYMENT_FAILED`

## H. Upgrade requirements (implemented)

1. Proration: `(target - current) * (remaining / total)` in minor units
2. Fail closed without `current_period_start` / `current_period_end`
3. Dedicated oneoff payment (not subscription update alone)
4. Post-payment: update recurring amount + flip plan + entitlements
5. UI shows prorated amount before payment
6. Never grant Business before payment
7. `upgrade_activated` email exactly once
8. Billing history entry for upgrade adjustment
9. Provider update failure: `sync_pending` flag, no double charge (idempotent payment ledger)

## I. Downgrade (preserved Phase 4)

Business→Professional scheduled next period via `scheduleMollieOrganizationDowngrade`. Emails: `DOWNGRADE_SCHEDULED`, `DOWNGRADE_CANCELED`, `DOWNGRADE_APPLIED`.

## J. Cancellation (fixed)

Stop renewal at Mollie; local `cancel_at_period_end=true`; access until `current_period_end`. UI: "Active — cancellation scheduled". `subscription_cancellation_scheduled` email. `subscription_ended` only at actual access end.

## K. Initial purchase

Webhook-authoritative: subscription create → billing history → `purchase_activated` email. Return page non-authoritative.

## L. Email matrix

| Event | Template key prefix | Trigger |
|-------|---------------------|---------|
| PURCHASE_ACTIVATED | `purchase_activated:` | First payment webhook |
| UPGRADE_ACTIVATED | `upgrade_activated:` | Upgrade payment webhook |
| DOWNGRADE_SCHEDULED | `plan_change_scheduled:` | Downgrade action |
| DOWNGRADE_CANCELED | `plan_change_canceled:` | Cancel scheduled change |
| DOWNGRADE_APPLIED | `plan_change_applied:` | Renewal webhook apply |
| SUBSCRIPTION_CANCELLATION_SCHEDULED | `subscription_cancellation_scheduled:` | Cancel action |
| SUBSCRIPTION_ENDED | `subscription_ended:` | Expire finalize webhook |

Sender: Auroranexis Notifications `<noreply@auroranexis.com>`. Email failure never rolls back billing state.

## M. Webhook routing

Classic payment webhook only. Route by `auroranexis_billing_purpose`:
- `upgrade_adjustment` → upgrade reconcile
- `initial_purchase` / `first` sequence → purchase reconcile
- existing `sub_` paid → renewal + pending downgrade apply

## N. Billing history

`billing_provider_transactions` rows for purchase, upgrade adjustment, renewal (paid). Real Mollie amounts.

## O. Migration

**YES** — `20250822020000_mollie_upgrade_payment_attempt.sql` adds `upgrade_payment_id`, `upgrade_target_plan`.

## P. FastSpring coexistence

Unchanged. Mollie writes refuse FastSpring overwrite. Global provider remains FastSpring.

## Q. LIVE safety

`MOLLIE_LIVE_CHARGING_ENABLED=false` in `.env.example`.

## R. Tests

`scripts/mollie-billing-phase4-1-recovery-v2.test.mjs` sections 58–62. Preserves Phase 2/3/4/4.1 suites.

## SELF-AUDIT

| Question | Answer |
|----------|--------|
| 1. Can customer get Business without paying upgrade amount? | **NO** |
| 2. Can canceled Mollie renewal remove paid access before paid-through? | **NO** |
| 3. Can initial purchase complete without purchase email persisted? | **NO** |
| 4. Can cancellation complete without cancellation email persisted? | **NO** |

## T–Y. Operator notes

**T.** Apply migration `20250822020000_mollie_upgrade_payment_attempt.sql` before deploy.  
**U.** Verify proration preview on Pro→Business shows amount then redirects to Mollie.  
**V.** Test cancel: UI shows "Active — cancellation scheduled" + access until date.  
**W.** Confirm billing history shows purchase + upgrade rows after webhook replay.  
**X.** Confirm emails in `transactional_email_deliveries` ledger.  
**Y.** **Next operator action:** Apply migration, deploy to allowlist staging, run Pro→Business upgrade + cancel regression on TEST Mollie keys.

---

## Files changed (summary)

- `src/lib/billing/providers/mollie/upgrade-payment.ts` (new)
- `src/lib/billing/providers/mollie/transactions.ts` (new)
- `src/lib/billing/providers/mollie/lifecycle.ts`
- `src/lib/billing/providers/mollie/webhooks.ts`
- `src/lib/billing/providers/mollie/organization-sync.ts`
- `src/lib/billing/providers/mollie/production-checkout.ts`
- `src/lib/billing/actions.ts`
- `src/lib/billing/checkout-eligibility.ts`
- `src/lib/billing/provider-details.ts`
- `src/lib/billing/plan-change.ts`
- `src/lib/email/purchase.ts` (new)
- `src/lib/email/billing-recipient.ts` (new)
- `src/lib/email/plan-change.ts`
- `src/lib/email/templates/purchase.ts` (new)
- `src/lib/email/templates/plan-change.ts`
- `src/components/settings/billing-mollie-management-panel.tsx`
- `src/types/database.ts`
- `supabase/migrations/20250822020000_mollie_upgrade_payment_attempt.sql` (new)
- `scripts/mollie-billing-phase4-1-recovery-v2.test.mjs` (new)
- `package.json`
