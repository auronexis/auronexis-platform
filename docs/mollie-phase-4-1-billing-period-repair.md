# Mollie Phase 4.1 — Billing Period Repair (Upgrade Blocker V2)

**Date:** 2026-08-23  
**Org:** `df827f64-84b7-42e1-91a7-9420febcf843`  
**Customer:** `cst_VpARnXYP6d` · **Sub:** `sub_Kfrbz2emPa` · Plan: Professional / active  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## 1. ROOT CAUSE

**File:** `src/lib/billing/providers/mollie/webhooks.ts`  
**Function:** production paid path with `existingSubscriptionId` (renewal/sync upsert)

**Incorrect transformation (pre-fix):**

```ts
currentPeriodStart: orgRow?.current_period_end ?? orgRow?.current_period_start ?? new Date().toISOString(),
currentPeriodEnd: nextPaymentDate,
```

On every paid event that reached this branch, start was rolled forward to the previous end **even when `nextPaymentDate` had not advanced**.

**Corruption sequence for this org (code-path inference):**

1. Recovery / mandate create wrote a valid window ≈ `2026-08-22T23:36:05Z` → `2026-09-22T00:00:00Z` (`createMollieProductionSubscriptionAfterMandate`).
2. A later paid webhook (recurring classification or redelivery) ran the renewal upsert while Mollie `nextPaymentDate` was still `2026-09-22`.
3. Start became previous end (`2026-09-22`); end stayed `nextPaymentDate` (`2026-09-22`) → **equal boundaries**.
4. UI: “Current period Sep 22, 2026 – Sep 22, 2026”.
5. `calculateMollieUpgradeProration` correctly fail-closed: `Billing period boundaries are invalid — refusing prorated upgrade.`

Canonical semantics restored:

| Mollie field | Meaning | Local mapping |
|--------------|---------|---------------|
| `createdAt` / `startDate` / payment `paidAt` | Evidence for paid-period start | `current_period_start` |
| `nextPaymentDate` | Next renewal boundary | `current_period_end` only |
| — | **Never** | `current_period_start = nextPaymentDate` |

---

## 2. WHY 6e673ae WAS INSUFFICIENT

Commit `6e673ae` fixed upgrade **checkout gating** (reuse of open `upgrade_payment_id`, sanitizer messages, refresh when bounds were **missing**).

It did **not**:

- Stop unconditional `current_period_start := current_period_end` on paid webhooks
- Treat **equal** start/end as invalid (truthy check only: `if (start && end) return …`)
- Centralize period normalization across recovery / webhook / sync / upgrade
- Provide deterministic repair for already-collapsed rows

So Professional → Business still failed once the row was `Sep22 → Sep22`.

---

## 3. WRITER MATRIX (summary)

| FILE / FUNCTION | EVENT | Values written | Source | Can overwrite valid? | Safe? |
|-----------------|-------|----------------|--------|----------------------|-------|
| `production-checkout.createMollieProductionSubscriptionAfterMandate` | New `sub_` after mandate | start ← Mollie `startDate`/`createdAt`/now; end ← `nextPaymentDate` | Mollie create response | Only on new sub create | **Yes** (post-fix) |
| Same, reuse entitlement-granting `sub_` | Idempotent reuse | Periods **not** written | — | No | **Yes** |
| `webhooks` paid + existing `sub_` | Renewal/sync | Via `resolveMollieBillingPeriodUpdate` | Local + `nextPaymentDate` | Advance start **only** if renewal and `nextPaymentDate` **>** existing end | **Yes** (post-fix) |
| `organization-sync.upsertMollieOrganizationSubscription` | All Mollie upserts | `input ?? existing` | Caller | Yes if caller passes bad start | Pass-through; callers fixed |
| `organization-sync.applyMolliePendingPlanChangeIfReady` | Pending apply at cycle | start+end from caller | Webhook period resolver | Same as webhook | **Yes** |
| `organization-sync.scheduleMolliePendingPlanChange` | Downgrade schedule | end ← pending effective / next | Mollie update | Preserves start | **Yes** |
| `lifecycle.applyMollieUpgradeAfterPayment` | Paid upgrade apply | sync mode period update | Mollie get + local | Preserves valid start | **Yes** |
| `lifecycle` cancel / finalize expire | Cancel at period end | end ← access until / next | Mollie + local | Preserves start | **Yes** |
| `upgrade-payment.resolveUpgradePeriodBounds` | Upgrade checkout | Repair if invalid/missing | Mollie + evidence | Does not accept equal as valid | **Yes** |
| `billing-period-repair.repairMollieOrganizationBillingPeriod` | Operator repair | Evidence-based start; end ← `nextPaymentDate` | Mollie + txns + payments | Only when invalid | **Yes** |
| `paid-purchase-recovery.recoverMolliePaidFreshPurchase` | Operator recover | Delegates to create-after-mandate | — | Reuse preserves; create sets initial | **Yes** |
| Seed / FastSpring / Stripe historical | N/A | Out of Mollie path | — | — | Untouched |

---

## 4. DATABASE FINDING

No live DB read from this engineering session. Inference from Vercel log + prior recovery state + UI:

| Field | Pre-corruption (reported) | Corrupted (observed) |
|-------|---------------------------|----------------------|
| `current_period_start` | `2026-08-22 23:36:05…` | `2026-09-22` (same as end) |
| `current_period_end` | `2026-09-22 00:00:00` | `2026-09-22` |
| `provider_price_id` | `professional` | `professional` |
| `status` | `active` | `active` |
| `provider_subscription_id` | `sub_Kfrbz2emPa` | unchanged |

No migration required — columns already exist; values are wrong.

---

## 5. CODE CHANGES

| Change | Purpose |
|--------|---------|
| `billing-period.ts` (new) | Canonical normalize / validate / renew / sync / initial / repair pure helpers |
| `webhooks.ts` | Use `resolveMollieBillingPeriodUpdate`; remove unconditional start←end |
| `organization-sync.ts` | Pending apply writes start+end together |
| `production-checkout.ts` | Initial period via `resolveMollieInitialBillingPeriod` |
| `upgrade-payment.ts` | Valid-period gate; evidence repair; no 30-day invent from end alone |
| `upgrade-proration.ts` | Delegate validity to `isValidMollieBillingPeriod` (guard kept) |
| `lifecycle.ts` | Upgrade apply uses sync period update (preserve start) |
| `billing-period-repair.ts` (new) | Idempotent operator repair from Mollie + transaction/payment evidence |
| Operator route | `action: "repair-billing-period"` |
| Tests + `package.json` | Mandatory period-repair suite wired into `test:mollie-billing` |

**Not changed:** FastSpring, LIVE kill switch, proration fail-closed guard message, no new customer charge/refund, no migration.

---

## 6. EXISTING ROW REPAIR PROCEDURE

**Preferred (deterministic, no guessed SQL):**

```http
POST /api/operator/mollie/paid-purchase-recovery
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json

{
  "action": "repair-billing-period",
  "organizationId": "df827f64-84b7-42e1-91a7-9420febcf843"
}
```

**Behavior:**

1. Load local Mollie `organization_subscriptions` row.
2. If already `end > start` → no-op success (`alreadyValid: true`).
3. Fetch Mollie `sub_Kfrbz2emPa` → `nextPaymentDate`, `startDate`, `createdAt`.
4. Collect evidence starts: Mollie dates, `billing_provider_transactions.billing_period_start` / `paid_at`, customer paid payment `paidAt`.
5. Set `current_period_end` from `nextPaymentDate`; set `current_period_start` from first evidence with `start < end`.
6. **Never** invent start from `nextPaymentDate` alone.
7. If no evidence → `{ repaired: false, reason: "missing_period_start_evidence" }` — **STOP**; do not run ad-hoc SQL with guessed dates.

**Do not:** create checkout, charge, refund, or cancel/recreate `sub_`.

After success, confirm Billing UI shows a non-equal period (e.g. Aug 22 → Sep 22), then retry Professional → Business upgrade.

---

## 7. TEST RESULTS

Suite: `scripts/mollie-billing-phase4-1-billing-period-repair.test.mjs` (in `npm run test:mollie-billing`)

| # | Requirement | Coverage |
|---|-------------|----------|
| 1 | Valid Aug22→Sep22 upgrade math | Pure proration > 0 |
| 2 | Equal Sep22→Sep22 blocked | Throws invalid boundaries |
| 3 | Sync must not collapse Aug22→Sep22 | Resolver + webhook source contract |
| 4 | Recovery/sync preserve valid period | Initial + upgrade source contracts |
| 5 | Renewal advances once | Advance + duplicate no-op |
| 6 | Duplicate webhook idempotent | Resolver + ledger contract |
| 7 | Failed upgrade leaves Professional | Webhook clear attempt |
| 8 | Successful upgrade no second `sub_` | update-only apply |
| 9 | Proration ≤ full delta mid-cycle | Pure math |
| 10 | Timezone / date-only no collapse | Sync + repair evidence |

Gates: lint, typecheck, mollie billing, fastspring billing, transactional-email, build — run at commit time.

---

## 8. EXPECTED DB/UI STATE AFTER REPAIR

| Surface | Expected |
|---------|----------|
| DB `current_period_start` | Evidence instant **before** end (typically paidAt / Mollie createdAt ≈ Aug 22) |
| DB `current_period_end` | Mollie `nextPaymentDate` (≈ Sep 22) |
| Invariant | `end > start`, both non-null |
| UI period | Non-equal dates (e.g. Aug 22 – Sep 22) |
| Plan | Professional / active until upgrade paid |
| Upgrade | Mollie TEST hosted checkout for remaining-period delta only (`$179→$599`) |
| After paid upgrade | Same `sub_`, Business once; fail leaves Professional |

---

## 9. COMMIT HASH

Message: `fix: preserve valid Mollie billing period for upgrades`  
Resolve with: `git log -1 --oneline --grep="preserve valid Mollie billing period"`  
(Not pushed from this chapter.)

---

## 10. EXACT MANUAL TEST PROCEDURE (TEST keys)

1. Confirm `MOLLIE_LIVE_CHARGING_ENABLED=false`.
2. Run operator `repair-billing-period` for org `df827f64-84b7-42e1-91a7-9420febcf843`.
3. Expect `repaired: true` with `currentPeriodStart < currentPeriodEnd` (or `alreadyValid: true`).
4. Open `/settings/billing` — period must not show identical start/end.
5. `/settings/plans` → Business → Upgrade.
6. Expect redirect to Mollie TEST checkout with **prorated** amount (not full $599).
7. Complete TEST payment → webhook → Business; one upgrade email; one `sub_` remains.
8. Re-deliver same webhook / re-click Upgrade on open payment → idempotent / reuse (no second charge).
9. Cancel/expire an upgrade payment → Professional remains.
10. Confirm FastSpring orgs unchanged.

---

## 11. Verdict

**FIXED AND READY FOR OPERATOR REPAIR + TEST UPGRADE**

Root cause was unconditional billing-period advance on paid Mollie webhooks collapsing `Aug22→Sep22` into `Sep22→Sep22`. Guard retained. Period sync/renewal/repair centralized. Existing row repaired via evidence-based operator action — no guessed SQL, no new charge, FastSpring untouched, LIVE remains off.

**Not LIVE-ready.** Do not set `MOLLIE_LIVE_CHARGING_ENABLED=true`.
