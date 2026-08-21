# Mollie Phase 4 Recovery Audit

**Date:** 2026-08-22  
**Scope:** Post–Phase 4 production-readiness recovery for Mollie plan-change lifecycle  
**Baseline commits:** Phase 3 `f730e9d` · Phase 4 `e2a8550`  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged; not enabled)

---

## FINAL VERDICT

**B — READY FOR CONTROLLED TEST / ALLOWLIST ROLLOUT AFTER OPERATOR APPLIES MIGRATION**

Runtime-critical defect (Pro→Business immediate local plan flip + Business→Pro portal-blocked UI) is remediated in code. Authoritative plan changes now require Mollie confirmation via pending fields + webhook apply. FastSpring coexistence and LIVE gates preserved.

**Not LIVE-ready.** Do not set `MOLLIE_LIVE_CHARGING_ENABLED=true`.

---

## CORE INVARIANT

**NO PLAN CHANGE AUTHORITATIVE UNTIL PROVIDER CONFIRMS.**

- Click Upgrade/Downgrade must **never** alone set `organization_subscriptions.provider_price_id` to the target.
- UI may show scheduled/pending change; Current Plan badge and entitlements stay on the prior plan until Mollie-confirmed apply.
- Mollie `customerSubscriptions.update` adjusts next-cycle amount only (no invented Stripe-style proration).

---

## A. Provider resolution / ownership / allowlist / rollout

| Fact | Status |
|------|--------|
| `getActiveBillingProvider()` → `"fastspring"` | PASS |
| Per-org ownership via Mollie-backed `organization_subscriptions` | PASS |
| Allowlist / `MOLLIE_BILLING_ROLLOUT` / `MOLLIE_BILLING_DEFAULT_FOR_NEW` for NEW only | PASS |
| Ownership survives rollout rollback | PASS |
| FastSpring ownership blocks Mollie checkout | PASS |

## B. `organization_subscriptions` writers

| Writer | Role |
|--------|------|
| `organization-sync.upsertMollieOrganizationSubscription` | Canonical Mollie upsert; writes `provider_price_id` (authoritative) + pending columns |
| `scheduleMolliePendingPlanChange` | Schedules pending without flipping current plan |
| `applyMolliePendingPlanChangeIfReady` | Applies pending after provider confirmation |
| `production-checkout.ts` | First payment / mandate / `sub_` create |
| `webhooks.ts` | Production reconcile; apply pending on paid recurring |
| `lifecycle.ts` | Plan change schedule + cancel |
| FastSpring sync / maintenance | Unchanged coexistence |

## C. Mollie checkout / customer / mandate / subscription / return / webhook / dupes

| Area | Status |
|------|--------|
| First payment + mandate + subscription | PASS (Phase 3/4) |
| Customer reuse `cst_` | PASS |
| Duplicate `sub_` blocked | PASS |
| Return page non-authoritative | PASS |
| Classic webhook + idempotency + API re-fetch | PASS |
| LIVE kill switch on webhook/route | PASS |

## D. Plan change Pro ↔ Business (fixed behavior)

**Before (Phase 4 defect):** `changeMollieOrganizationPlan` updated Mollie amount **and immediately** wrote `provider_price_id = target` → UI/entitlements showed Business without extra payment confirmation.

**After (recovery):**

1. Validate auth/role/org, provider=mollie, active `sub_`, no conflicting pending, LIVE/test gates.
2. Mollie `customerSubscriptions.update` amount/description/metadata (in-place; never cancel+create).
3. Local row keeps `provider_price_id = current`; sets `pending_plan`, `pending_plan_effective_at` (from `nextPaymentDate`), `pending_plan_change_type`, `provider_change_reference`.
4. Webhook paid + existing `sub_` → `applyMolliePendingPlanChangeIfReady` flips authoritative plan and clears pending.
5. Failed renewal keeps authoritative current plan (`failedPlanKey`); status maps to `past_due` / `inactive`.

## E. `/settings/plans` and `/settings/billing` UI

| Issue | Fix |
|-------|-----|
| Downgrade disabled: “Use billing portal… unavailable” | `billingProvider !== "mollie"` exception in `pricing-reasons`; grid passes `billingProvider` |
| Portal assumed for Mollie | Plans/billing copy: Mollie has no hosted portal; change plan via Plans |
| Cancel unwired | `cancelMollieSubscriptionAction` exposed on billing panel for Mollie |
| Premature “Current Plan” on upgrade | Current plan remains SoT from `provider_price_id` until apply |

## F. Webhook / reconciliation

- Classic payment webhook only; re-fetch Payment (+ Subscription).
- Idempotency via `mollie_webhook_events`.
- Pending apply on paid existing subscription.
- Failure path does not promote pending target plan.

## G. Phase 4 tests / false passes

- Prior Phase 4 suite was largely source-contract; missed UI portal block for Mollie downgrade and immediate local plan write.
- Recovery adds contracts **P–W** covering pending schedule, webhook apply, UI Mollie exception, cancel wiring, migration, success copy, LIVE=false, audit doc.

## H. Pending plan model

Additive migration `20250822010000_mollie_pending_plan_change.sql`:

- `pending_plan`
- `pending_plan_effective_at`
- `pending_plan_change_type` (`upgrade` \| `downgrade`)
- `provider_change_reference`

Indexed where pending set. No secrets. RLS unchanged (same table).

## I. Entitlements

Remain driven by authoritative usable subscription + mapped `provider_price_id`. Pending does not grant Business early. Scheduled downgrade keeps Business until apply.

## J. Customer / subscription uniqueness

Unchanged: one Mollie customer reuse; one active `sub_` per org; plan change updates in place.

## K. Payment logic

Upgrade/downgrade: amount update for next Mollie cycle only — no invented mid-cycle charge. Confirmation = successful paid webhook reconcile.

## L. Downgrade timing

Effective at Mollie `nextPaymentDate` (stored as `pending_plan_effective_at`); entitlements stay on Business until apply.

## M. Cancellation

Immediate Mollie cancel API; clears pending; no fake cancel-at-period-end; UI wired for Mollie.

## N. Failed renewal

Maps to non-usable statuses; does not forever remain Active+Paid with pending target applied.

## O. Recovery without dupes

Open first-payment reuse + duplicate `sub_` guards preserved; plan change never creates second subscription.

## P. Classic webhook only

Confirmed — no Next-Gen / `X-Mollie-Signature` path.

## Q. Idempotency

Webhook ledger + plan-change conflict if pending already set.

## R. LIVE safety

`MOLLIE_LIVE_CHARGING_ENABLED` independent of rollout; remains false in `.env.example` / this work.

## S. FastSpring coexistence

No silent migration; ownership blocks cross-provider checkout; FastSpring code retained.

## T. Security checklist

- [x] No `NEXT_PUBLIC_MOLLIE_*` secrets
- [x] Service role / Mollie client server-only
- [x] Webhook re-fetches Mollie API
- [x] Return page does not grant entitlements
- [x] RLS not weakened
- [x] Auth / signup / SMTP untouched
- [x] LIVE kill switch default off

## U. Manual TEST scenarios (operator)

1. Initial Mollie TEST checkout → Active Professional Paid  
2. Duplicate Professional button disabled  
3. Upgrade Pro→Business → UI stays Professional Current; pending Business scheduled; Mollie amount updated; **no** free Business entitlements  
4. After next paid cycle webhook → Business becomes current  
5. Failed upgrade payment / failed renewal → stays Professional (or past_due), not Business  
6. Duplicate upgrade while pending → refused  
7. Downgrade Business→Pro → button enabled (no portal message); Business remains current until effective apply  
8. Cancel Mollie from billing panel → immediate cancel path  
9. FastSpring org unchanged / blocked from Mollie checkout  

## V. Regression gates

Run: lint, typecheck, `test:mollie-billing`, FastSpring/billing/production-readiness suites as configured, build. LIVE remains false.

## W. What Phase 4 report got wrong

Phase 4 claimed plan-change readiness, but runtime showed immediate local plan flip on upgrade and portal-blocked downgrade UI. Source-contract tests did not catch product UX truth.

## X. Residual risks / Version 2 debt

- Mollie has no hosted portal and no cancel-at-period-end — documented accurately now.
- Pending apply depends on classic payment webhooks firing for renewals — operator must keep webhook URL healthy.
- Migration must be applied in each environment before pending columns are usable.
- Entitlement cache/UI refresh after apply still depends on normal revalidation paths.

## Y. One next operator action

**Apply migration `20250822010000_mollie_pending_plan_change.sql` to the target Supabase project, keep `MOLLIE_LIVE_CHARGING_ENABLED=false`, then re-run manual TEST scenarios 3–7 on an allowlisted org.**
