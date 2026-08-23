# Mollie Phase 4.1 — Idempotency-Key Length Fix

**Date:** 2026-08-23  
**Status:** READY FOR TEST UPGRADE  
**Scope:** Outbound Mollie `Idempotency-Key` header construction only  
**LIVE:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## A. ROOT CAUSE

**File:** `src/lib/billing/providers/mollie/upgrade-payment.ts`  
**Function (pre-fix):** local `buildIdempotencyKey(organizationId, operation, attemptId)`

```ts
return `mollie:prod:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
```

Same unbounded concatenation also existed in:

- `src/lib/billing/providers/mollie/production-checkout.ts`
- `src/lib/billing/providers/mollie/checkout.ts`

Mollie enforces **≤ 100 characters**. The helper sliced to **255**, so upgrade keys still exceeded the provider limit.

---

## B. PROVIDER CONFIRMATION

Mollie `POST /v2/customers/cst_VpARnXYP6d/payments` returned **400**:

```
Invalid idempotency key 'mollie:prod:df827f64-84b7-42e1-91a7-9420febcf843:upgrade_adjustment:a542f693-daa6-457f-b478-af47a0a152f6'. Please provide a unique string of up to 100 characters.
```

Org `df827f64-84b7-42e1-91a7-9420febcf843`, customer `cst_VpARnXYP6d`, active Professional `sub_Kfrbz2emPa` — payment create never succeeded.

---

## C. OLD KEY FORMAT + OBSERVED LENGTH

| Item | Value |
|------|-------|
| Format | `mollie:prod:{orgUuid}:{operation}:{attemptUuid}` |
| Failed key | `mollie:prod:df827f64-84b7-42e1-91a7-9420febcf843:upgrade_adjustment:a542f693-daa6-457f-b478-af47a0a152f6` |
| **Observed length** | **104** |
| Mollie max | 100 |
| Other ops (same UUIDs) | `first_payment` = 99, `subscription` = 98 (under limit but fragile) |

Defect was **most acute on upgrade** (`upgrade_adjustment` is 18 chars) but **all three** local helpers used the unsafe pattern.

---

## D. NEW KEY FORMAT + MAX LENGTH

**Helper:** `src/lib/billing/providers/mollie/idempotency-key.ts` → `buildMollieIdempotencyKey`

| Item | Value |
|------|-------|
| Format | `m:{t\|p}:{sha256hex64}` |
| Example shape | `m:p:a1b2c3…` (64 hex chars) |
| **Always length** | **68** |
| Hard cap constant | `MOLLIE_IDEMPOTENCY_KEY_MAX_LENGTH = 100` |
| Hash input | `surface \0 organizationId \0 operation \0 attemptId` via `createHash("sha256")` |

No `Math.random()` / `Date.now()` as sole uniqueness. No blind truncation of readable IDs.

---

## E. IDEMPOTENCY SEMANTICS

One logical outbound Mollie create (payment or subscription) maps to one key for:

`(surface, organizationId, operation, attemptId)`

| Property | Behavior |
|----------|----------|
| Same inputs | Same key (safe Mollie replay) |
| Different `attemptId` | Different key (new checkout attempt) |
| Different org | Different key |
| Different operation | Different key (`first_payment` / `subscription` / `upgrade_adjustment`) |
| Different surface | Different key (`test` → `m:t:…`, `prod` → `m:p:…`) |

`checkoutAttemptId` lifecycle unchanged: still `randomUUID()` per new upgrade create; reusable open payments keep their metadata attempt id.

---

## F. SCOPE (AFFECTED MOLLIE OPS)

| Path | Surface | Operations |
|------|---------|------------|
| `upgrade-payment.ts` | `prod` | `upgrade_adjustment` |
| `production-checkout.ts` | `prod` | `first_payment`, `subscription` |
| `checkout.ts` (TEST parallel) | `test` | `first_payment`, `subscription` |

Inbound webhook ledger (`mollie_webhook_events` / `ensureMollieIdempotency`) is **unchanged**.

FastSpring / LIVE kill switch / Business activation-before-payment: **untouched**.

---

## G. FAILED ATTEMPT `a542f693-…` CLEANUP

**No production data mutation required.**

Payment create failed with 400 **before** `persistUpgradePaymentAttempt`. Therefore:

- No Mollie `tr_*` payment was created for that attempt
- `organization_subscriptions.upgrade_payment_id` should not have been set from this failure
- Next Upgrade after deploy generates a **fresh** `checkoutAttemptId` via `randomUUID()`

Operator optional check (read-only): confirm `upgrade_payment_id` is null or only references a real open/terminal payment — see section O.

---

## H. FILES CHANGED

- `src/lib/billing/providers/mollie/idempotency-key.ts` *(new)*
- `src/lib/billing/providers/mollie/upgrade-payment.ts`
- `src/lib/billing/providers/mollie/production-checkout.ts`
- `src/lib/billing/providers/mollie/checkout.ts`
- `src/lib/billing/providers/mollie/foundation.ts` *(docs comment)*
- `scripts/mollie-billing-phase4-1-idempotency-key.test.mjs` *(new)*
- `scripts/mollie-billing-phase3.test.mjs` *(assertion update)*
- `package.json` *(wire new test into `test:mollie-billing`)*
- `docs/mollie-phase-4-1-idempotency-key-fix.md` *(this file)*

---

## I. TESTS / GATES

Suite: `scripts/mollie-billing-phase4-1-idempotency-key.test.mjs`

| ID | Assertion |
|----|-----------|
| A | length ≤ 100 (legacy failed key = 104) |
| B | same logical op → same key |
| C | different attempt → different key |
| D | different org → different key |
| E | namespaces don’t collide |
| F | TEST/prod surface tags |
| G | long inputs still ≤ 100 |
| H | create paths send helper |
| I | upgrade no longer concatenates UUIDs |
| J | recovery/cancellation/payment wiring intact |

Gates: `lint`, `typecheck`, `test:mollie-billing`, `test:fastspring-billing`, `test:transactional-email`, `build` (when practical).

---

## J. COMMIT HASH

See git log after commit: `fix: bound Mollie upgrade idempotency keys`

---

## K. PUSH STATUS

**LOCAL ONLY** — do not push unless explicitly instructed.

---

## L. OPERATOR TEST PROCEDURE

1. Deploy this commit to the environment under test (Vercel preview/prod as approved).
2. Confirm `MOLLIE_LIVE_CHARGING_ENABLED=false` if still using TEST credentials.
3. Sign in as the affected org (Professional active, `sub_Kfrbz2emPa`).
4. Settings → Billing → Upgrade Professional → Business.
5. Expect hosted Mollie checkout URL (not “upgrade unavailable”).
6. **Do not** complete payment unless intentionally testing paid upgrade; abort/cancel checkout is fine for key-length validation.
7. Confirm Professional remains authoritative until a paid webhook (no Business before payment).

---

## M. EXPECTED VERCEL LOG SEQUENCE

```
[billing][upgrade] upgrade_proration { organizationId, previousPlanKey, targetPlanKey, netDueCents, … }
[billing][upgrade] upgrade_attempt_create { organizationId, checkoutAttemptId, netDueCents }
[billing][upgrade] upgrade_payment_create { organizationId, paymentId, result: "created" }
[billing][upgrade] upgrade_payment_redirect { organizationId, paymentId, checkoutAttemptId, reusedOpenPayment: false }
```

Must **not** see `result: "provider_error"` with Mollie “Invalid idempotency key … up to 100 characters”.

---

## N. EXPECTED MOLLIE API LOG

- `POST /v2/customers/{cst_…}/payments` → **201** (not 400)
- Request header `Idempotency-Key` matches `^m:p:[0-9a-f]{64}$` (68 chars)
- No 400 body complaining about key length

---

## O. DATABASE VERIFICATION SQL

Read-only checks (replace org id if needed):

```sql
-- Authoritative subscription must remain Professional until paid upgrade webhook
SELECT
  organization_id,
  billing_provider,
  provider_customer_id,
  provider_subscription_id,
  provider_status,
  status,
  plan_key,
  upgrade_payment_id,
  upgrade_target_plan,
  sync_pending,
  current_period_start,
  current_period_end
FROM organization_subscriptions
WHERE organization_id = 'df827f64-84b7-42e1-91a7-9420febcf843'
  AND billing_provider = 'mollie';

-- After a successful payment *create* (before pay): upgrade_payment_id may be tr_*
-- After key-length failure historically: upgrade_payment_id should still be null
-- After paid webhook: plan_key/business fields update via existing upgrade reconcile (unchanged)
```

---

## P. FINAL VERDICT

**READY FOR TEST UPGRADE**

Engineering fix is complete and local. Operator must deploy and re-run Professional → Business upgrade initiation to confirm Mollie accepts the bounded key. No automatic second charge/checkout was created by this change.
