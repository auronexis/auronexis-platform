# Mollie Phase 4.1 — Post-Upgrade Hardening

**Date:** 2026-08-23  
**Scope:** Return-page race UX + missing Business activation email after successful TEST upgrade  
**Org (verified):** `df827f64-84b7-42e1-91a7-9420febcf843`  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED=false` (unchanged)

---

## N. FINAL VERDICT

**OPERATOR ACTION REQUIRED** — code hardening is ready; replay the missing activation email for the already-paid Business upgrade, then proceed to the next lifecycle test.

Engineering: return UX + email await/reclaim + idempotent operator replay are implemented. Do not enable LIVE. Do not create another checkout/charge.

---

## A. RETURN-PAGE ROOT CAUSE

The production return page (`mollie/return/page.tsx`) reused **purchase-oriented** `resolveMollieProductionReturnPageState` without upgrade-specific confirming UX or bounded polling.

For `purpose=upgrade`:

1. While Professional remained usable (pre-webhook), the page still rendered purchase-style warning/technical copy (“query params are not trusted”) rather than a calm confirming state.
2. Purchase `activation_failed` / error-boundary paths (“Contact support”) remained reachable if Mollie re-fetch threw or sync windows looked inconsistent — false hard-failure tone during **normal webhook delay**.
3. No client poll: users needed a hard reload to see Business after `upgrade_apply`.

Webhook remained authoritative; the defect was **presentation + timing**, not entitlement grant from the return URL.

---

## B. TIMING EVIDENCE

| Moment | Authoritative state | Return UX (before fix) |
|--------|---------------------|-------------------------|
| Mollie redirect lands | Professional still active; upgrade payment open/paid pending webhook | Warning / verifying / support-adjacent copy; no poll |
| `upgrade_webhook_paid` → `upgrade_apply { applied: true }` | Business Active Paid; period Aug22→Sep22 intact | Not reflected until navigation/hard reload |
| Hard reload | Business Active | Success-looking billing page |

Observed product truth: upgrade **succeeded**; return page lagged and could look like failure during the webhook gap.

---

## C. RETURN-PAGE FIX

| Change | Purpose |
|--------|---------|
| Upgrade kinds in `return-state.ts`: `upgrade_confirming`, `upgrade_success`, `upgrade_payment_failed` | Separate upgrade UX from purchase activation_failed |
| Mollie payment re-fetch only for terminal failure | Failed/canceled/expired → real failure; API errors stay confirming |
| `MollieUpgradeReturnPoller` (~1.5s × ~18s) | Server re-fetch until Business authoritative or neutral timeout |
| Copy | “Payment received. We're confirming your upgrade.” / timeout: safe to leave |
| Query params | Still non-authoritative; never flip `provider_price_id` |

---

## D. EMAIL ROOT CAUSE (exact file/function/condition)

**File:** `src/lib/billing/providers/mollie/webhooks.ts`  
**Function:** `reconcileMollieUpgradePayment`  
**Condition after `upgrade_apply.applied === true`:**

```ts
void getOrganizationNameForBillingEmail(organizationId)
  .then((organizationName) => sendUpgradeActivatedEmail(...))
```

1. `sendUpgradeActivatedEmail` **was** intended after `applied: true` (post DB upsert).
2. Dispatch was **fire-and-forget** (`void`) — Vercel/serverless can freeze after the webhook HTTP response before claim/send completes.
3. `providerUpdateFailed` did **not** skip email when `applied: true`.
4. Idempotency: `transactional_email_deliveries` UNIQUE `(user_id, template_key)`. A stuck `claimed` or `failed` row caused later attempts to **skip** as “idempotent” without sending.
5. Same stack as purchase: `sendTransactionalEmail` + Auroranexis noreply branding.

---

## E. CURRENT EMAIL DELIVERY RECORD (code-path inference)

Live DB not queried from this hardening session. Code-path inference for the verified incident:

| Possibility | Likelihood |
|-------------|------------|
| No `transactional_email_deliveries` row | High — process froze before `claimDelivery` |
| Row `claimed` / `failed` never finalized to `sent` | Medium — claim succeeded, send interrupted |
| Row `sent` but mail undelivered/spam | Low — user reported no arrival; treat as missing until ledger proves `sent` |

Operator replay uses the new deterministic key and reclaim logic; safe if no `sent` row exists.

---

## F. EMAIL FIX

| Change | Purpose |
|--------|---------|
| `await sendUpgradeActivatedEmail` inside try/catch after apply | Completes before webhook returns; failure logged, Business stays |
| Template key `upgrade_activated:org:sub:payment:prev->applied` | Exactly one email per paid upgrade |
| Reclaim `failed` / stale `claimed` in `transactional.ts` | Retry without duplicate when status was never `sent` |
| Subject | `Your Business plan is now active — Auroranexis` |
| Branded HTML | Workspace, Pro→Business, immediate, payment confirm, renewal if known, View Billing, support@, noreply |
| Webhook replay | Skips when ledger status is `sent` |

---

## G. EXISTING INCIDENT RECOVERY

For org `df827f64-84b7-42e1-91a7-9420febcf843` (Business already active):

```http
POST /api/operator/mollie/paid-purchase-recovery
Authorization: Bearer <CRON_SECRET>
Content-Type: application/json

{
  "action": "replay-upgrade-email",
  "organizationId": "df827f64-84b7-42e1-91a7-9420febcf843",
  "paymentId": "<paid upgrade tr_…>"
}
```

Guards:

- Verifies usable Business (or enterprise) Mollie subscription
- Verifies paid upgrade `billing_provider_transactions` row for that `tr_`
- **Never** mutates subscription, period, or creates a charge
- Idempotent: second run skips if email already `sent`
- No org-id special-case

Resolve `paymentId` from billing history / Mollie dashboard for the upgrade adjustment.

---

## H. FILES CHANGED

- `src/lib/email/transactional.ts`
- `src/lib/billing/plan-change.ts`
- `src/lib/email/plan-change.ts`
- `src/lib/email/templates/plan-change.ts`
- `src/lib/billing/providers/mollie/webhooks.ts`
- `src/lib/billing/providers/mollie/return-state.ts`
- `src/lib/billing/providers/mollie/upgrade-return-actions.ts`
- `src/lib/billing/providers/mollie/upgrade-email-recovery.ts`
- `src/components/settings/mollie-upgrade-return-poller.tsx`
- `src/app/(dashboard)/settings/billing/mollie/return/page.tsx`
- `src/app/api/operator/mollie/paid-purchase-recovery/route.ts`
- `scripts/mollie-billing-phase4-1-post-upgrade-hardening.test.mjs`
- `package.json`
- `docs/mollie-phase-4-1-post-upgrade-hardening.md`

---

## I. TEST RESULTS

| Gate | Result |
|------|--------|
| `npm run test:mollie-billing` | PASS (217) |
| `npm run test:transactional-email` | PASS (41) |
| `npm run test:fastspring-billing` | PASS (37) |
| `npm run lint` | PASS (pre-existing warnings only) |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

---

## J. DEP0169 SOURCE

`url.parse()` deprecation was **not** found in Auroranexis Mollie webhook/application code. Webhook body parsing uses `URLSearchParams` / `JSON.parse` in `extractMollieWebhookPaymentId`. DEP0169 in Vercel logs is attributed to a **dependency** (likely Node/`@mollie/api-client` or transitive). Document only — no app code change.

---

## K. COMMIT HASH

Commit on `main`: `fix: finalize Mollie upgrade confirmation and email` (local; see `git log -1 --format=%H`).

---

## L. PUSH STATUS

**LOCAL ONLY** (no auto-push).

---

## M. MANUAL ACCEPTANCE TEST

1. Start Professional→Business TEST upgrade; on return **before** webhook: confirming copy, not support/error.
2. After webhook: poller shows success + View Billing without hard reload.
3. Strip/alter query params: cannot activate Business.
4. Cancel/expire upgrade payment: failure copy; Professional remains.
5. Paid upgrade: exactly one activation email (ledger `sent`).
6. Replay webhook / operator twice: no duplicate email.
7. Force email provider failure in staging: Business stays active; ledger `failed`; retry sends once.
8–10. Purchase / downgrade scheduled / cancel emails unchanged.
11. Billing period Aug22→Sep22 (or current bounds) unchanged.
12. FastSpring orgs unaffected.
13. Upgrade Idempotency-Key length ≤100 still holds.

---

## Constraints preserved

- No billing architecture redesign  
- FastSpring behavior untouched  
- LIVE remains false  
- No new checkout/charge from this work  
- Billing-period + idempotency key fixes retained  
- Webhook remains authoritative  
