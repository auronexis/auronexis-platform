# Final LIVE Billing Activation Gate

**Date:** 2026-08-26  
**Repository:** Auroranexis (`main`)  
**Production:** https://www.auroranexis.com / https://app.auroranexis.com  
**Scope:** Prove whether operator MAY later enable `MOLLIE_LIVE_CHARGING_ENABLED=true` — this gate does **not** enable LIVE charging, create live subscriptions, refund, push, or deploy.

---

## 1. VERDICT

**LIVE_ACTIVATION_BLOCKED**

Technical money-path controls for controlled DE domestic B2B self-serve are largely proven in code and regression. LIVE commercial charging remains blocked because:

1. **P1-002 external tax/legal review is still `EXTERNAL REVIEW REQUIRED`** (`docs/p1-002-external-tax-legal-review-package.md`).
2. **Required production migrations are not operator-confirmed applied** in repository evidence (`docs/enterprise-production-golive-playbook.md` item 3 = **INCOMPLETE**).
3. Therefore **Safe to change `MOLLIE_LIVE_CHARGING_ENABLED` to true after operator approval = NO**.

---

## 2. Repository State

| Check | Result |
|-------|--------|
| Branch | `main` |
| Working tree at gate start | Clean |
| Dirty unrelated tree | No — proceed |
| LIVE charging enabled by this work | **No** |
| Push / deploy / Mollie/Vercel/Supabase prod mutation | **No** |

---

## 3. Complete Money Flow

```
Plan/Price catalog (server EUR minor units)
  → Session org + RBAC + B2B contract + billing identity
  → Tax policy (DE self-serve only; EU RC / non-EU fail-closed)
  → Mollie first payment (PSP) [TEST always; LIVE requires charging flag]
  → Return page (UX only — non-authoritative)
  → Webhook: extract id → Mollie payments.get → idempotent reconcile
  → Subscription create / renew / upgrade / cancel paths
  → organization_subscriptions usability
  → resolveOrganizationEntitlements (Auroranexis authority)
  → Sales invoice issue (domestic) + tax evidence snapshots
```

**Invariant:** Mollie is PSP only. Entitlements never come from return URL, checkout success callback, or unverified webhook body alone.

---

## 4. Plan / Price Authority

**PASS**

- Catalog: `src/lib/billing/price-catalog.ts` (authoritative EUR minor units).
- Plans: `src/lib/billing/plans.ts` builds from catalog.
- Checkout actions accept plan key (+ contract) only — no client-supplied amount.
- Mollie amount formatted from server plan minor units.
- Price consistency helpers reject mismatched catalog/checkout/charge/invoice amounts.

---

## 5. Tenant Safety

**PASS**

- Checkout/management actions: `requireSession` + org settings permission; writes use `session.organization.id`.
- Webhook: service-role by design; trust via Mollie re-fetch + customer/org metadata mismatch rejection.
- Mollie org subscription writes refuse overwriting retired FastSpring ownership.

---

## 6. B2B Gate

**PASS**

- Server Zod requires `b2bEntrepreneurConfirmed === true`.
- Tax policy blocks when B2B confirmation missing (`b2b_confirmation_required`).
- Contract acceptance evidence persisted at checkout.

---

## 7. Billing Identity

**PASS WITH OBSERVATIONS**

- Country required for tax; VAT required for EU non-DE; VIES validated server-side.
- Legal name falls back to organization name; full postal address not strictly required before first payment (P2 observation for invoice completeness).

---

## 8. DE Tax Path

**PASS**

- Domestic DE B2B → `STANDARD_DOMESTIC_VAT` @ 1900 bps.
- Self-serve allowed only for that outcome (`taxOutcomeAllowsSelfServeCheckout`).
- VAT-inclusive split uses integer minor units.

---

## 9. EU / VIES Path

**PASS (fail-closed)**

- Valid VIES → `REVERSE_CHARGE` outcome **and** `blocksCheckout: true` until counsel-approved legend.
- Invalid / unavailable / not_checked / skipped VIES → `UNKNOWN_BLOCK_CHECKOUT`.
- Country mismatch alone ≠ Reverse Charge.

---

## 10. Reverse Charge

**PASS (engineering fail-closed; LIVE EU self-serve still blocked)**

- Legend resolver never invents customer-facing RC text while `LEGAL_TEXT_PENDING_COUNSEL`.
- Auto invoice issuance limited to domestic standard VAT path.

---

## 11. Non-EU Policy

**PASS**

- Non-EU → `MANUAL_REVIEW` + checkout blocked.
- Tax calculation throws for manual/unknown outcomes (no silent 0%).

---

## 12. Mollie Mode Separation

**PASS**

- Key prefix `test_` / `live_` via `resolveMollieApiModeFromKey`.
- LIVE payment ops require explicit charging flag (`assertMolliePaymentOpsAllowed`).
- Webhook rejects LIVE traffic with 503 when charging flag off.
- Rollout (`MOLLIE_BILLING_ROLLOUT`) independent of LIVE charging flag.

---

## 13. First Payment

**PASS**

- Production first payment path creates Mollie payment with server amount / `sequenceType=first`.
- Self-serve plans: professional / business (enterprise manual).
- Duplicate open payment reuse / subscription duplicate guards present.

---

## 14. Webhook Authority

**PASS**

- Route extracts payment id only; reconciler calls `client.payments.get(paymentId)`.
- Subscriptions re-fetched where needed.
- Body never treated as authoritative commercial state.

---

## 15. Idempotency

**PASS**

- Inbound: `ensureMollieIdempotency` + webhook event ledger; duplicate → 200.
- Outbound: `buildMollieIdempotencyKey` ≤ 100 chars, deterministic.
- Transaction / invoice uniqueness on provider transaction id.

---

## 16. Payment Status Matrix

**PASS**

- Paid / pending / terminal failure helpers centralised in lifecycle-status.
- Only paid proceeds to mandate/subscription activation.
- Unhandled statuses do not invent entitlements.

---

## 17. Subscription Lifecycle

**PASS**

- Fresh purchase: webhook → subscription create + org sync + postcondition validation.
- Operator recovery: `recoverMolliePaidFreshPurchase` + cron-authenticated operator route (blocked when LIVE charging enabled).

---

## 18. Renewal / Failure Behavior

**PASS**

- Renewal classification + billing period update on recurring payments.
- Suspended/past_due mapping; no entitlement grant while not active.

---

## 19. Upgrade / Downgrade

**PASS WITH OBSERVATIONS**

- Upgrade: immediate prorated Mollie payment from catalog deltas.
- Downgrade: scheduled next cycle; plan unchanged until apply.
- Restricted to self-serve professional↔business; enterprise manual.

---

## 20. Cancellation

**PASS**

- Cancel-at-period-end tracked locally (Mollie API cancel is immediate).
- Paid-through access until `current_period_end`.
- Withdrawal path recreates subscription with mandate when supported.

---

## 21. Pilot Access

**PASS WITH OBSERVATIONS**

- Pilot not in Mollie self-serve keys; entitlements via plan override / admin path.
- TEST Mollie surface tables do not grant production entitlements.
- Observation: pilot orgs with rollout on could still use normal Mollie checkout unless operator uses override policy.

---

## 22. Entitlement Authority

**PASS**

- `resolveOrganizationEntitlements` is sole authority.
- Mollie paid/return UX cannot activate access alone.
- Minimal entitlements fallback when subscription not usable.
- Active provider: Mollie only (`getActiveBillingProvider()` → `"mollie"`).

---

## 23. Invoice Issuance

**PASS WITH OBSERVATIONS**

- Domain sales invoices issued on paid domestic Mollie payments.
- Number allocation via RPC (fallback documented if RPC missing).
- Non-domestic auto-issue skipped (fail-closed).

---

## 24. Invoice Immutability

**PASS**

- Seller + tax decision evidence snapshots migration present.
- Issued invoices presented as immutable customer views; no void/mutate totals path for refunds.

---

## 25. Refund / Credit Note Boundary

**PASS (accurately NOT IMPLEMENTED)**

- `SALES_INVOICE_CREDIT_NOTE_STATUS.supported === false`.
- Refunds must not mutate issued invoice totals; credit notes deferred (P1 product gap for refund ops — not a silent incorrect state).

---

## 26. E-Invoice Status

**PASS (accurate)**

- Domain model ready; `xmlGenerationEnabled: false`; generator returns deferred code — no fake XRechnung/ZUGFeRD XML.

---

## 27. Contract Evidence

**PASS**

- Terms / B2B / DPA / checkout summary versions + DB persistence of acceptances at checkout.

---

## 28. Return Page Security

**PASS**

- Return state explicitly non-authoritative; page copy states query params are not trusted.
- Does not call entitlement grant APIs.

---

## 29. Failure Recovery Matrix

| ID | Scenario | Customer impact | Retry / recovery | Operator visibility | Consistency | Manual recovery |
|----|----------|-----------------|------------------|---------------------|-------------|------------------|
| A | Checkout attempt; Mollie create fails | No charge | User retries checkout | Action error | No paid row | N/A |
| B | Mollie payment exists; local persist fails | May have open Mollie payment | Reuse open payment / webhook later | Logs | Idempotent upsert | Operator inspect Mollie |
| C | Paid; webhook delayed | Paid, pending activation UX | Return poll + webhook | Return “awaiting” | Eventually consistent | Wait / force webhook |
| D | Paid; webhook duplicated | None | Idempotency ledger | duplicate 200 | Safe | N/A |
| E | Paid; subscription create fails | Paid without access | Operator paid-purchase recovery | Postcondition failed | Recoverable | Operator recover API |
| F | Subscription exists; local sync fails | Possible UI lag | Webhook re-fetch / sync | Logs | Recoverable | Operator recover / sync |
| G | Invoice issue fails after paid | Access may exist; invoice missing | Retry issue path | Logs | Commercial access ≠ invoice | Manual invoice ops |
| H | VIES unavailable | Checkout blocked | Retry later | Reason code | Fail-closed | Manual sales |
| I | DB error during webhook | Mollie may retry | 5xx → Mollie retry; idempotent | Logs | Safe retry | Ops DB |

**Unrecoverable paid-money without path:** not identified for fresh purchase (recovery + webhook re-fetch exist). LIVE operator recovery intentionally blocked while charging flag is true (safety).

---

## 30. Observability

**PASS**

- Structured logs with truncated ids; billing analytics without org/customer secrets.
- Production env audit names-only.

---

## 31. Secret Audit (NAMES ONLY)

| Name | Role |
|------|------|
| `MOLLIE_API_KEY` | Mollie API |
| `MOLLIE_BILLING_ROLLOUT` | Checkout rollout |
| `MOLLIE_BILLING_ORG_ALLOWLIST` | Partial enable |
| `MOLLIE_BILLING_DEFAULT_FOR_NEW` | Diagnostics |
| `MOLLIE_LIVE_CHARGING_ENABLED` | LIVE write kill switch |
| `VIES_VALIDATION_MODE` / `VIES_CHECK_VAT_URL` | VAT validation |
| `CRON_SECRET` | Operator recovery auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes |

Committed production secrets: **0** (repo audit expectation; `.env.example` documents defaults).

---

## 32. Legacy Provider Audit

**PASS**

| Provider | Active runtime paths |
|----------|----------------------|
| FastSpring | **0** (webhook 410) |
| Stripe | **0** |
| Paddle | **0** |
| Mollie | Sole active |

---

## 33. Production Migration Manifest

**Do NOT apply from this gate.**

| Migration | Required by current code? | Additive? | Expected prod state | Verification (operator) | Order |
|-----------|---------------------------|-----------|---------------------|-------------------------|-------|
| `20250820000000_mollie_test_subscription_lifecycle.sql` | Yes (webhook events / test surface) | Additive | Applied | Tables/policies exist | 1 |
| `20250822010000_mollie_pending_plan_change.sql` | Yes | Additive | Applied | Pending plan columns | 2 |
| `20250822020000_mollie_upgrade_payment_attempt.sql` | Yes | Additive | Applied | Upgrade attempt table | 3 |
| `20250824100000_p1_002_pricing_tax_invoice_contracting.sql` | Yes | Additive | Applied | billing identity / invoices / RPC | 4 |
| `20250826100000_sales_invoice_tax_evidence_snapshots.sql` | Yes | Additive | Applied | snapshot columns | 5 |

**Operator confirmation in repo:** **NO** → contributes to **LIVE_ACTIVATION_BLOCKED**.

---

## 34. Production Configuration Manifest

| Config | Required value for controlled mode | LIVE charging later |
|--------|------------------------------------|---------------------|
| `MOLLIE_API_KEY` | Prefer `test_` until LIVE approval | `live_` only after counsel + migrations |
| `MOLLIE_BILLING_ROLLOUT` | `true` for Mollie checkout | unchanged |
| `MOLLIE_LIVE_CHARGING_ENABLED` | **`false`** | flip only after this gate READY |
| Mollie webhook | Classic `/api/mollie/webhook` | same |
| Legacy Stripe/Paddle/FastSpring keys | Absent | Absent |

**Required configuration confirmed in repo evidence:** **NO** (playbook items still INCOMPLETE).

---

## 35. Activation Switch Proof

**PASS (fail-closed)**

Truthy only: `1` / `true` / `yes` / `on` (trim + lower). Missing/other → false. LIVE key without flag throws / webhook 503.

---

## 36. Rollback Plan

**PASS (documented + code kill switches)**

1. Set `MOLLIE_LIVE_CHARGING_ENABLED=false` immediately.
2. Optionally set `MOLLIE_BILLING_ROLLOUT=false` to stop new checkout.
3. Follow `docs/rollback-plan.md` for deploy/webhook pause.
4. Do not corrupt historical Mollie-owned subscription rows.

**Verified:** YES (code + docs).

---

## 37. First Live Customer Runbook

**DO NOT EXECUTE from this gate.**

### PRE-ACTIVATION
- CI green (typecheck, lint, build, Mollie + gate suites)
- Production deployment green
- Migrations in §33 confirmed applied + PITR/backup recorded
- Mollie LIVE profile approved; classic webhook registered
- Live credentials configured; **`MOLLIE_LIVE_CHARGING_ENABLED=false`** until flip
- P1-002 counsel sign-off recorded

### ACTIVATION
- Set `MOLLIE_LIVE_CHARGING_ENABLED=true` only
- Redeploy/restart if env injection requires it

### FIRST CHECKOUT
- Legitimate DE B2B customer only (self-serve scope today)
- Verify org, country/VAT, plan, EUR amount
- Complete Mollie payment

### POST-PAYMENT
- Mollie paid → webhook processed → org subscription → entitlements → invoice + tax evidence → billing UI
- No duplicate payment/subscription/invoice
- Sentry clean for billing errors

### ROLLBACK CONDITION
- Any commercial-state inconsistency → immediately set charging flag false

---

## 38. Test Matrix

Behavioral suite: `scripts/final-live-billing-activation-gate.test.mjs` (A–Z + legacy + migrations).  
Command: `npm run test:final-live-billing-gate`

| ID | Coverage | Result |
|----|----------|--------|
| A–Z | Tax, spoof, gate, payment statuses, idempotency, return, recovery, invoice, pilot, cancel, entitlements | PASS (28/28) |
| Legacy | FastSpring/Stripe/Paddle active = 0 | PASS |
| Migrations | Required files present | PASS |

---

## 39. Validation Results

| Suite | Result |
|-------|--------|
| Typecheck (`npm run typecheck`) | **PASS** |
| Lint (`npm run lint`) | **PASS** (pre-existing warnings only; exit 0) |
| Build (`npm run build`) | **PASS** |
| Mollie suite (`npm run test:mollie-billing`) | **PASS** (323/323) |
| Enterprise regression (`npm run test:enterprise-regression`) | **PASS** (399/399) |
| Legacy regression (`npm run test:legacy-billing-removal`) | **PASS** (16/16) |
| P1-002 / tax-invoice (`npm run test:p1-002-pricing-tax`) | **PASS** (28/28) |
| Production readiness (`npm run test:production-readiness`) | **PASS** (17/17) |
| Final production closeout (`npm run test:final-production-closeout`) | **PASS** (30/30) |
| Auth / session cookies (`npm run test:auth-session-cookies`) | **PASS** (6/6) |
| Final LIVE gate A–Z (`npm run test:final-live-billing-gate`) | **PASS** (28/28) |
| npm audit --audit-level=high | **PASS** (0 vulnerabilities) |

---

## 40. Blockers

1. **P1-002 EXTERNAL REVIEW REQUIRED** — unrestricted LIVE revenue not authorized.
2. **Production migrations not operator-confirmed** applied (playbook INCOMPLETE).
3. **Production config ritual incomplete** in repo evidence (secrets/webhook/PITR sign-off).
4. EU Reverse Charge self-serve intentionally blocked until counsel legend (expected; blocks broad LIVE EU).
5. Credit notes not implemented (refund ops must stay manual / non-mutating).

---

## 41. Operator Actions

1. Complete P1-002 external tax/legal/MoR review; record sign-off in release artifacts.
2. Confirm §33 migrations applied on production Supabase (staging first); record backup/PITR.
3. Confirm Mollie classic webhook + env diff vs `.env.example`; keep charging flag **false**.
4. Clear remaining Chapter 19/20 playbook INCOMPLETE rows.
5. Only then reconsider flipping `MOLLIE_LIVE_CHARGING_ENABLED` under a new READY gate.
6. Until credit notes exist: manual refunds must not edit issued invoice totals.

---

## 42. Final Statement

Auroranexis can run **SAFE CONTROLLED PRODUCTION MODE** (Mollie TEST / LIVE charging off, DE domestic B2B self-serve fail-closed).  

**LIVE_ACTIVATION_READY is not met.** Real customer LIVE charging must not be enabled until external counsel clears P1-002 and operators confirm production migrations/configuration. Follow money → org → tax → Mollie authoritative state → subscription → entitlement → invoice: a real payment must not produce incorrect commercial state; remaining blockers are release/process gates, not an invitation to bypass fail-closed tax or charging switches.

**Current state:** `MOLLIE_LIVE_CHARGING_ENABLED=false`  
**Safe to change to true after operator approval:** **NO**
