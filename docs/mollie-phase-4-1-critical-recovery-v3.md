# Mollie Phase 4.1 Critical Recovery V3

**Date:** 2026-08-23  
**Scope:** Production incident — false success after fresh purchase following canceled Mollie subscription  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## FINAL VERDICT

**A — READY FOR CONTROLLED TEST / ALLOWLIST ROLLOUT (NO NEW MIGRATION)**

Root cause remediated: stale canceled `sub_` no longer steers fresh-purchase webhook routing; explicit `providerSubscriptionId: null` clears stale rows; subscription-after-mandate never reuses canceled provider subscriptions; webhook postcondition failures mark `mollie_webhook_events=failed` (HTTP 200 ack to Mollie); operator recovery can reconcile already-paid `tr_` without a third payment.

**Not LIVE-ready.** Do not set `MOLLIE_LIVE_CHARGING_ENABLED=true`.

---

## A. Production incident summary

| Signal | Observed |
|--------|----------|
| Mollie payment | `paid` |
| Webhook HTTP | `200` |
| `mollie_webhook_events` | `processed` |
| `billing_provider_transactions` | `paid` |
| `organization_subscriptions` | `status=canceled`, stale `sub_` retained |
| Entitlements | None |
| Purchase email | Missing |
| UI | "No active subscription" |

## B. Root cause (confirmed)

1. `webhooks.ts` used org-row stale `provider_subscription_id` for `sequenceType=first` payments → renewal branch.
2. `organization-sync.ts` treated explicit `providerSubscriptionId: null` as "preserve existing sub_".
3. `production-checkout.ts` reused canceled `sub_` and copied canceled status after mandate.
4. Webhook marked `processed` even when business postcondition failed.
5. Paid transactions labeled `"Professional renewal"` for first payments.

## C. Invariant (fresh purchase after cancellation)

Stale canceled/completed/expired `sub_` must **not** control fresh-purchase reconciliation.

## D. Payment classification

`payment-classification.ts`:

| Kind | Detection |
|------|-----------|
| `initial_purchase` | `sequenceType=first` OR `auroranexis_billing_purpose=initial_purchase` |
| `upgrade_adjustment` | `auroranexis_billing_purpose=upgrade_adjustment` |
| `renewal` | recurring payment on active/non-stale `sub_` |

Product labels:

- Initial → `{Plan} subscription`
- Renewal → `{Plan} renewal`
- Upgrade → `Upgrade adjustment — {Plan}`

## E. Webhook routing fix

Production reconcile order:

1. Upgrade adjustment (metadata purpose)
2. **Fresh purchase** when `shouldRouteMolliePaymentAsInitialPurchase` (stale canceled sub ignored)
3. Renewal on verified non-stale `sub_`
4. Fallback first-payment reconcile

## F. organization-sync fix

- `providerSubscriptionId: undefined` → preserve existing
- `providerSubscriptionId: null` → **clear** stale `sub_`
- `resetStaleSubscriptionState: true` → clear cancel/period/pending/upgrade attempt fields

## G. production-checkout fix

- Checkout start clears stale lifecycle via `resetStaleSubscriptionState`
- `createMollieProductionSubscriptionAfterMandate` reuses `sub_` only when `isMollieSubscriptionEntitlementGranting`

## H. Webhook postcondition semantics

Before `markMollieEventProcessed` on fresh purchase:

- `resolveSubscriptionUsability` must be true
- `sync_pending` must be false
- `provider_subscription_id` must be present
- Must not remain hard-canceled without paid-through reason

On failure: `markMollieEventFailed` + HTTP 200 ack (Mollie retry-safe internal state).

## I. Return page (`/settings/billing/mollie/return`)

`resolveMollieProductionReturnPageState`:

| State | UX |
|-------|-----|
| `success` | Active subscription confirmed |
| `processing` | Paid, activation in progress |
| `activation_failed` | Paid `tr_` but inactive org sub — recoverable |
| `awaiting_confirmation` | No paid signal yet |

Never grants entitlements from query params.

## J. Purchase email

`sendPurchaseActivatedEmail` after postcondition pass only. Idempotent via `purchase_activated:{sub_id}:{payment_id}` ledger.

## K. Cancellation email (preserved V2)

`resolvePrimaryBillingRecipientForEmail` + `sendSubscriptionCancellationScheduledEmail` with ledger idempotency.

## L. Entitlements (preserved V2)

`resolveSubscriptionUsability` honors `cancel_at_period_end` paid-through window — no premature "No active subscription".

## M. Operator recovery (no third payment)

`recoverMolliePaidFreshPurchase({ organizationId, paymentId })`:

1. Fetch Mollie payment, verify `paid` + `initial_purchase`
2. Refuse stale canceled sub as current authority
3. Create new subscription after mandate
4. Upsert billing transaction with correct product label
5. Send purchase email once if ledger missing

`analyzeMollieDuplicatePaidFirstPayments` reports duplicate paid first payments for operator review (no auto-refund).

## N. Duplicate payment analysis (incident)

Two paid `tr_` ~2 minutes apart labeled renewal were caused by fresh purchases misrouted through the renewal branch (stale `sub_`). Both payments are valid charges; operator should:

1. Run recovery on the **latest** paid first-payment `tr_`
2. Document the earlier `tr_` for manual refund/credit decision
3. Do **not** initiate a third checkout

## O. Recovery without another payment

**YES** — use `recoverMolliePaidFreshPurchase` with org id + paid `tr_` id.

## P. Migration

**NO** — uses existing `upgrade_payment_id` / `upgrade_target_plan` columns from V2 migration only.

## Q. FastSpring coexistence

Unchanged. Mollie writes refuse FastSpring overwrite. Global provider remains FastSpring.

## R. LIVE safety

`MOLLIE_LIVE_CHARGING_ENABLED=false` in `.env.example`.

## S. Tests

`scripts/mollie-billing-phase4-1-recovery-v3.test.mjs` — sections 63–82 + postconditions A–E (25 tests). Preserves Phase 2/3/4/4.1 + Recovery V2 suites.

## T. Files changed

- `src/lib/billing/providers/mollie/payment-classification.ts` (new)
- `src/lib/billing/providers/mollie/paid-purchase-recovery.ts` (new)
- `src/lib/billing/providers/mollie/return-state.ts` (new)
- `src/lib/billing/providers/mollie/webhooks.ts`
- `src/lib/billing/providers/mollie/organization-sync.ts`
- `src/lib/billing/providers/mollie/production-checkout.ts`
- `src/lib/billing/providers/mollie/index.ts`
- `src/app/api/mollie/webhook/route.ts`
- `src/app/(dashboard)/settings/billing/mollie/return/page.tsx`
- `scripts/mollie-billing-phase4-1-recovery-v3.test.mjs` (new)
- `package.json`
- `docs/mollie-phase-4-1-critical-recovery-v3.md` (new)

## U. SELF-AUDIT

| Question | Answer |
|----------|--------|
| 1. Can stale canceled sub steer fresh purchase webhook? | **NO** |
| 2. Can paid fresh purchase mark webhook processed while sub canceled? | **NO** |
| 3. Can first payment be labeled renewal in billing history? | **NO** |
| 4. Can operator recover paid org without third payment? | **YES** |
| 5. Is FastSpring path affected? | **NO** |

## V. Operator action

1. Deploy to allowlist staging (TEST Mollie keys).
2. For affected production org: run `recoverMolliePaidFreshPurchase` with paid `tr_` id.
3. Run `analyzeMollieDuplicatePaidFirstPayments` and decide manual refund on duplicate `tr_`.
4. Replay webhook or recovery — verify `organization_subscriptions.status=active`, entitlements, purchase email once.
5. Do **not** enable LIVE.

## W. Manual TEST sequence

1. **TEST 1** — Active sub renewal webhook → renewal label, status stays active.
2. **TEST 2** — Cancel at period end → paid-through UI, no premature inactive.
3. **TEST 3** — Cancel fully, then fresh checkout (`sequenceType=first`) → new `sub_`, active, purchase email.
4. **TEST 4** — Repeat TEST 3 on org with stale canceled `sub_` in DB → must not reuse old `sub_`.
5. **TEST 5** — Simulate postcondition failure → webhook event `failed`, not `processed`.
6. **TEST 6** — Return page shows success/processing/activation_failed appropriately.
7. **TEST 7** — `recoverMolliePaidFreshPurchase` on paid `tr_` → active without new payment.
8. **TEST 8** — Pro→Business upgrade proration (V2 preserved).
9. **TEST 9** — Scheduled downgrade + cancel scheduled change (V2 preserved).
10. **TEST 10** — FastSpring org blocked from Mollie checkout.

## X. Gates

```bash
npm run lint
npm run typecheck
npm run test:mollie-billing
npm run test:fastspring-billing
npm run test:transactional-email
npm run build
```

## Y. Recovery V2 preserved

- Immediate paid upgrade with proration (`upgrade-payment.ts`)
- Scheduled downgrade
- Cancel scheduled change
- Cancel at period end

## Z. Commit

```
fix: recover Mollie fresh purchase after canceled subscription
```
