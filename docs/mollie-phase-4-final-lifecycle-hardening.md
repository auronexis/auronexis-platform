# Mollie Phase 4 FINAL — Lifecycle Hardening

**Status:** Implemented at HEAD  
**Scope:** Monthly renewal audit, period-end cancellation safety, cancellation withdrawal (“Keep subscription”), payment-status paid-through fix, transactional email, tests 1–20.  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## A — Monthly renewal (automatic)

| Layer | Implementation |
|-------|----------------|
| Provider subscription | `customerSubscriptions.create` with `interval: "1 month"` after first-payment mandate (`production-checkout.ts`) |
| Mandate | Valid/pending mandate from `customerMandates.page`; reused for recurring charges |
| Webhook | Paid recurring payment → `classifyMollieProductionPayment` → `renewal` |
| Period advance | `resolveMollieBillingPeriodUpdate(..., mode: "renewal")` rolls `current_period_*` |
| Ledger | `recordMolliePaidTransaction` writes `billing_provider_transactions` |
| Failure | Mollie `suspended` → local `past_due` (`lifecycle-status.ts`) |

**Customer repurchase is not required for monthly renewal.** Mollie charges the mandate on each interval; Auroranexis syncs via webhook.

---

## B — Period-end cancellation (why no renewal after)

1. `cancelMollieOrganizationSubscription` calls Mollie `customerSubscriptions.cancel` (**immediate** on provider — no future charges).
2. Local row sets `cancel_at_period_end = true` and keeps `current_period_end`.
3. Entitlements use `isSubscriptionPaidThroughPeriodEnd` / `resolveSubscriptionUsability` so access continues until period end even if `provider_status` is `canceled`.
4. Webhook path calls `finalizeMollieSubscriptionIfExpired` after period end → local `status = canceled`, `cancel_at_period_end = false`.
5. Mandate/customer are **not** revoked (needed for withdrawal recreate).

Duplicate cancel emails: template key `subscription_cancellation_scheduled:{sub}:{access_until}` via `billing_system` ledger.

---

## C — Provider cancellation model

| Concern | Behavior |
|---------|----------|
| Mollie API | **Immediate** cancel (`MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END` is local semantics only) |
| Auroranexis | **Period-end access** via `cancel_at_period_end` + `current_period_end` |
| Reactivate same `sub_` | **Not supported** (`MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false`) |

---

## D — Cancellation withdrawal (resume vs recreate)

**Resume same subscription:** impossible on Mollie API.

**Implemented strategy — safe recreate:**

`withdrawMollieOrganizationSubscriptionCancellation` (`cancellation-withdrawal.ts`):

1. Verify org is Mollie-owned, `cancel_at_period_end`, paid-through, `current_period_end` in the future.
2. Reuse existing `provider_customer_id` + usable mandate.
3. If another active/pending Mollie subscription already exists for the customer → adopt it (no duplicate).
4. Else `customerSubscriptions.create` with:
   - `mandateId` (existing)
   - `startDate` = `YYYY-MM-DD` of `current_period_end` (**not now**)
   - `interval: "1 month"`
   - idempotency key `withdraw_cancel` / `withdraw:{oldSub}:{startDate}`
5. Local: new `provider_subscription_id`, `cancel_at_period_end = false`, `status = active`, **preserve** `current_period_start/end`.

Idempotent: already withdrawn → success no-op. After period end → reject with `SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE`.

---

## E — No-immediate-charge proof

- Create uses **future** `startDate` equal to existing `current_period_end`.
- No `payments.create` / first-payment sequence in withdrawal.
- Logging includes `immediateCharge: false`.
- UI + email copy: “No charge today”; next renewal = period end date.

---

## F — Duplicate protection

| Mechanism | Effect |
|-----------|--------|
| Mollie Idempotency-Key | Same org/attempt → same create |
| List customer subscriptions | Adopt existing active/pending replacement |
| Local `cancel_at_period_end === false` | Early no-op success |
| UI transition + confirm modal | Reduces double-submit |

---

## G — Payment status fix

When `cancel_at_period_end` and paid-through:

- `getPaymentSummaryLabel(rawStatus, { paidThrough, paidThroughLabel })` → **Paid through {date}** (or **Paid**).
- Does **not** invent provider payment method status; uses authoritative paid-through window.
- Tone stays success via `getPaymentSummaryTone(..., { paidThrough })`.

Prevents “No payment on file” while the org is still paid through period end.

---

## H — Email behavior

| Event | Subject pattern | Template key |
|-------|-----------------|--------------|
| Withdrawal | `Your {Plan} subscription will continue — Auroranexis` | `subscription_cancellation_withdrawn:{sub}:{renewalAt}` |

- Sent once via `billing_system` / `sendTransactionalEmail` idempotency.
- Includes workspace, plan, withdrawn, active, next renewal, no immediate charge, View Billing, support.
- **Email failure does not roll back** successful restore (`void` + `.catch` after withdraw succeeds).

---

## I — Files changed (primary)

- `src/lib/billing/providers/mollie/cancellation-withdrawal.ts` (new)
- `src/lib/billing/providers/mollie/lifecycle-status.ts`
- `src/lib/billing/providers/mollie/index.ts`
- `src/lib/billing/subscription-management.ts`
- `src/lib/billing/status.ts`
- `src/lib/billing/types.ts`
- `src/lib/billing/actions.ts`
- `src/lib/email/subscription-management.ts`
- `src/lib/email/templates/subscription-management.ts`
- `src/components/settings/billing-mollie-management-panel.tsx`
- `src/components/settings/billing-settings-panel.tsx`
- `scripts/mollie-billing-phase4-final-lifecycle.test.mjs`
- `docs/mollie-phase-4-final-lifecycle-hardening.md`
- `package.json` (`test:mollie-billing`)

---

## J — Test results

| Gate | Result |
|------|--------|
| `npm run test:mollie-billing` | PASS (237 tests, including final lifecycle 1–20) |
| `npm run test:transactional-email` | PASS (41) |
| `npm run test:fastspring-billing` | PASS (37) |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |

Source-contract suite: tests **1–20** in `scripts/mollie-billing-phase4-final-lifecycle.test.mjs`.

---

## K — Commit hash

See git log after `feat: mollie cancellation withdrawal and renewal lifecycle hardening`.

---

## L — Push status

**Not pushed** (per chapter / Phase 4 constraints unless operator requires).

---

## M — Manual test procedure

1. Mollie TEST mode; `MOLLIE_LIVE_CHARGING_ENABLED=false`.
2. Org with active Business (or Pro) Mollie subscription, valid `current_period_end`.
3. Cancel subscription → confirm Active — cancellation scheduled; access until date; payment status **Paid through {date}**.
4. Click **Keep subscription** → confirm modal (no charge today; next renewal = period end).
5. Success: green message; `cancel_at_period_end=false`; status Active; renewal date restored.
6. Double-click Keep → idempotent success; no second Mollie active sub for customer.
7. Confirm no new charge in Mollie dashboard for the withdraw create (startDate in future).
8. Regression: upgrade, scheduled downgrade + cancel downgrade, cancel-at-period-end still work.
9. After artificial period end (or wait): finalize path removes access; withdraw then rejected safely.

---

## N — Final verdict

**READY FOR CONTROLLED LIVE PILOT** from an engineering lifecycle perspective, with operator prerequisites:

- Complete Phase 19 incomplete conditions before production promote.
- Flip LIVE only after operator checklist + FastSpring coexistence confirmation.
- No engineering auto-push/deploy from this chapter.

Working Phase 4 flows (purchase, upgrade, downgrade schedule/cancel, cancel at period end, emails, periods, LIVE off) are preserved by contract tests.
