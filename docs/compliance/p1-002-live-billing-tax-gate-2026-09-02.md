# P1-002 Live Billing / Tax / MoR — Engineering & Operator Gate (2026-09-02)

**Mission type:** Strict audit · evidence reconciliation · gate decision  
**Not:** Billing rewrite · Mollie migration · checkout redesign · tax implementation · pricing change · payment test · env/DB mutation · public legal rewrite · invented legal conclusions  

**Disclaimer:** Engineering and operator gate only. **Not** legal advice, tax advice, GDPR/AI Act certification, or counsel/tax approval. Forbidden labels **not** asserted: `LEGAL_APPROVED`, `COUNSEL_APPROVED`, `TAX_APPROVED`, `FULLY_COMPLIANT`.

---

## 1. Executive verdict

```text
VERDICT = P1_002_ENGINEERING_OPERATOR_GATE_CLOSED_COUNSEL_TAX_REVIEW_OPEN
OPEN_P0 = NONE
ENGINEERING_P1_002 = NONE
OPERATOR_P1_002 = NONE
COUNSEL_TAX_ITEMS = OPEN_SEPARATELY
LIVE_B2B_ARCHITECTURE = READY
LIVE_CHARGING_CHANGE_REQUIRED = NO
LEGAL_TAX_APPROVAL_INFERRED = NO
```

Runtime proves **Auroranexis = contractual seller / invoice issuer**; **Mollie = PSP only (not MoR)**. Self-serve DE / verified EU RC / verified NON-EU B2B paths are implemented with fail-closed gates. B2C and ambiguous tax treatments cannot start Mollie payment ops. Counsel/tax professional review remains open separately and does **not** invent an engineering P1 under this mission’s blocker standard.

---

## 2. Repository / freeze baseline

| Check | Result |
|-------|--------|
| Branch | `main` |
| Starting HEAD | `9faafff08bef836c0a99d5f4dc3acbba9ba4fbde` |
| `origin/main` | `1fe7a59085060fa67d679bc70f702ef0106a8de7` |
| Local stack preserved | `1fe7a59` → `7a76d63` → `ee6bce2` → `638daf7` → `9faafff` (+ this docs commit) |
| Reset / rebase / squash / amend / push / deploy | **NO** |
| Operator prior | `OPERATOR_COMPLIANCE_CLOSURE_COMPLETE`, `READY_TO_START_P1_002=YES` ([`operator-final-closure-2026-09-02.md`](./operator-final-closure-2026-09-02.md)) |

---

## 3. Absolute freeze attestation

| Control | Observed |
|---------|----------|
| Mollie / checkout / subscriptions / webhooks / invoices / E-Invoice / numbering / tax calc / entitlements / pricing / portal / billing UI / lifecycle | **Unchanged** |
| `MOLLIE_LIVE_CHARGING_ENABLED` | **Not toggled** |
| API keys / webhook secrets / env / Supabase / DB / migrations / RLS / RBAC / auth / routing / deps / lockfiles | **Unchanged** |
| Real payment / self-purchase / refund / cancel / paid AI / webhook mutation / customer mutation / invoice creation | **None** |
| Secrets printed | **None** (`VALUE_NOT_DIRECTLY_READABLE` where env not inspected) |
| `FROZEN_SYSTEMS_CHANGED` | **NO** |

---

## 4. Historical P1-002 document classification

| Document | Class | Notes / FastSpring-MoR |
|----------|-------|------------------------|
| `docs/p1-002-de-eu-legal-tax-certification.md` (2026-08-24) | **FALSE_FOR_CURRENT_RUNTIME** (VAT/VIES/B2B/invoice claims) · **HISTORICAL** audit | Pre-remediation: claimed 20% placeholder, no VIES, no B2B attestation. MoR: correctly said Mollie not MoR. |
| `docs/p1-002-remediation-pricing-tax-invoice-contracting.md` | **CURRENT_WITH_DRIFT** | Remediation complete narrative; EU RC still described as blocked pending counsel legend — **superseded by C3** (`IMPLEMENTATION_TEXT_APPROVED_FOR_C3` allows self-serve). Seller/PSP correct. |
| `docs/p1-002-external-tax-legal-review-package.md` | **CURRENT** (handoff package) · superseded for dossier detail | Correct Mollie≠MoR; tax geography matches runtime. |
| `docs/p1-002-external-signoff-dossier.md` | **CURRENT** | Best engineering handoff; LIVE off; counsel/tax sign-off still required. |
| `docs/final-live-billing-activation-gate.md` | **CURRENT_WITH_DRIFT** (process gate) | Correct money path; still frames LIVE blocked by P1-002 external review + migrations — aligned with counsel-open / not engineering rewrite. |
| `docs/billing/e-invoice-readiness-roadmap.md` | **CURRENT_WITH_DRIFT** | Claims structured XML **NOT IMPLEMENTED**; runtime now has `src/lib/einvoice/**` CII generation + post-issuance archive (Phase 10). **No engineering reopen this mission.** |
| `docs/einvoice-immutable-compliance-archive.md` | **CURRENT_WITH_DRIFT** | Early note “not wired from Mollie”; issuance now calls `integrateIssuedSalesInvoiceWithEInvoiceArchive`. |
| `docs/mollie-provider-consolidation-final.md` | **HISTORICAL** cutover | FastSpring retired; Mollie sole active; `LEGAL_REVIEW_REQUIRED` retained (counsel). |
| `docs/paddle-billing.md` / FastSpring MoR statements | **HISTORICAL** | Explicitly obsolete operational guidance. |
| Cursor rule `build-bible-v2-ch12-paddle-billing.mdc` | **HISTORICAL / SUPERSEDED wording** vs Ch1 Mollie | Not a runtime provider; do not treat as active FastSpring MoR. |
| Compliance FastSpring-as-active-MoR rows | **REMEDIATED** (2026-09-02 operator execution) | Prior `CURRENT_FALSE=0` for active-MoR assertions. |

---

## 5. Seller / PSP / MoR truth (CURRENT runtime)

| Concern | Who | Evidence |
|---------|-----|----------|
| Creates commercial transaction / plan charge amount | **Auroranexis** (server catalog) | `src/lib/billing/price-catalog.ts`, checkout uses server `amountMinor` |
| Checkout session / Mollie Payment create | **Auroranexis** → Mollie API | `src/lib/billing/providers/mollie/production-checkout.ts` (`assertMolliePaymentOpsAllowed`) |
| Plan / price authority | **Auroranexis** | Catalog; no client-supplied amount |
| Payment record (PSP) | **Mollie** (+ Auroranexis sync) | Webhook re-fetch `payments.get` → `billing_provider_transactions` |
| Subscription usability / entitlements | **Auroranexis** after verified sync | Entitlements never from return URL alone |
| Sales invoice issuer | **Auroranexis** | `issueSalesInvoice` / `sales_invoices` |
| Seller identity on invoice | **Auroranexis** (`COMPANY_INFORMATION`) | `seller-tax-config.ts` ← `DE449657077`, Althütte address |
| Invoice numbering | **Auroranexis** DB RPC | `allocate_sales_invoice_number` → `ANX-YYYY-######` |
| Tax evidence | **Auroranexis** | `tax-decision-evidence.ts` snapshots on invoice |
| B2B eligibility / B2C block | **Auroranexis** | Zod + `determineTaxPolicy` |
| EU VAT / VIES | **Auroranexis** (calls EU VIES) | `vies.ts` |
| Reverse charge determination + legend | **Auroranexis** | `tax-policy.ts`, `reverse-charge-legend.ts` |
| E-Invoice artifacts (when archived) | **Auroranexis** from issued snapshot | `einvoice-integration` / `einvoice` |

| Role | Classification |
|------|----------------|
| `AURORANEXIS_ROLE` | **SELLER** (contractual seller + invoice issuer + tax decision owner) |
| `MOLLIE_ROLE` | **PSP** (payment processing only; **not** Merchant of Record) |
| Active provider | `getActiveBillingProvider()` → `"mollie"` (`src/lib/billing/provider.ts`) |

Public/legal positioning: Terms/refund describe Mollie as payment service provider (`src/lib/company/legal-content.ts`). Counsel characterisation of Art. 28 subprocessor vs PSP remains **COUNSEL_REVIEW_REQUIRED** (not an engineering MoR rewrite).

---

## 6. Customer matrix

| Segment | Supported self-serve? | VAT treatment | Invoice | Fail-closed? | Sources |
|---------|----------------------|---------------|---------|--------------|---------|
| **DE B2B** | **YES** | `STANDARD_DOMESTIC_VAT` @ **1900 bps (19%)**, VAT-inclusive split | Auto-issue when seller/buyer snapshots complete | Country required; B2B confirmation required | `tax-policy.ts` L136–143; `taxes.ts`; `sales-invoice-from-mollie.ts` |
| **EU B2B (VIES valid)** | **YES** | `REVERSE_CHARGE` @ 0 bps + C3 implementation legend | Auto-issue when seller+buyer VAT present + legend gate | Missing/invalid/unavailable VIES → block | `tax-policy.ts` L170–178; `vies.ts`; C3 tests |
| **EU B2B unverified** | **NO** | `UNKNOWN_BLOCK_CHECKOUT` | No auto-issue | **YES** | `tax-policy.ts` L159–198 |
| **Non-EU B2B** | **YES** (confirmed entrepreneur + non-EU country) | `NON_EU_B2B_PLACE_OF_SUPPLY` @ 0 + C3.2 legend | Auto-issue when legend gate | Country alone without B2B → block | `tax-policy.ts` L146–156 |
| **B2C / no entrepreneur confirm** | **NO** | `UNKNOWN_BLOCK_CHECKOUT` (`b2b_confirmation_required`) | Skipped | **YES** (signup + checkout Zod `=== true`) | `contracting.ts`; `actions.ts` L111–117; `auth/actions.ts` |

**Can unsupported / ambiguous reach LIVE charging via self-serve?** → **NO**  
Checkout persists identity / creates Mollie payment only after `!determination.blocksCheckout` (`actions.ts`). LIVE payment ops additionally require `MOLLIE_LIVE_CHARGING_ENABLED` (`mode.ts` / webhook 503). Ambiguous tax never silently becomes 0% charge path.

---

## 7. VAT / VIES architecture

### OWN_SELLER_VAT_STATUS

| Field | Value |
|-------|--------|
| Configured product VAT ID | `DE449657077` (`company-information.ts`) |
| Seller tax config gate | `getSellerTaxConfiguration()` → `ready` when name/VAT/street/PLZ/city present |
| Active BZSt/VIES status of seller ID | **Not re-validated this mission** → operator/tax adviser confirmation remains open (no ID mutation) |

### CUSTOMER_VAT_VALIDATION_ARCHITECTURE

| Step | Implementation |
|------|----------------|
| Capture | Checkout contract: country, optional VAT, address (`checkoutContractSchema`) |
| Normalize | `normalizeVatId` / `splitVatId` (`vies.ts`) |
| Validate format | Invalid format rejected before determination |
| VIES | `validateVatIdWithVies` — SOAP EU checkVat; 8s timeout; fault/HTTP/parse fail → `unavailable` |
| Skip mode | `VIES_VALIDATION_MODE=skip` → `skipped` (**≠ valid**) |
| Evidence storage | `organization_billing_identities.vies_status` / `vies_checked_at`; invoice `tax_decision_evidence` |
| Failure / timeout / unavailable | `UNKNOWN_BLOCK_CHECKOUT` (`vies_not_validated` / `vies_invalid`) |
| Reverse charge | Only `viesStatus === "valid"` + EU non-DE + B2B confirmed |

`IMPLEMENTATION_TEXT_APPROVED_FOR_C3` / `C3_2` are **engineering** legend gates — **not** external counsel/tax sign-off.

---

## 8. Invoice ownership

| Topic | Evidence |
|-------|----------|
| Numbering | `ANX-YYYY-######` via `allocate_sales_invoice_number` only (`sales-invoice.ts`) |
| Seller / buyer | Immutable `seller_snapshot` + buyer address/VAT columns |
| Amounts | Net / VAT bps / VAT / Gross invariant; VAT-inclusive split for domestic |
| Reverse charge | `reverse_charge_applied` + bilingual legend when C3 gate met |
| Immutability | Render/PDF/email/e-invoice consume stored facts; unique `(organization_id, provider_transaction_id)` prevents duplicates |
| Mollie relation | `mollie_payment_id` / `provider_transaction_id` link; issuance best-effort after paid sync |

**No regenerate/mutate of production invoices in this mission.**

---

## 9. Mollie receipt ≠ legal sales invoice

**Proven distinct:**

- UI copy: sales invoice PDF vs Mollie payment receipt (`billing-history-panel.tsx`).
- Domain: `sales_invoices` owns Net/VAT/Total; Mollie checkout URL is receipt/payment status, not Auroranexis tax invoice.
- Code does **not** treat Mollie dashboard settlement as UStG sales invoice substitute.

---

## 10. E-Invoice relation (read-only; no reopen)

| Layer | Current fact |
|-------|--------------|
| PDF sales invoice | **Implemented** (primary customer legal PDF path) |
| Post-issuance pipeline | `issueSalesInvoice` → `integrateIssuedSalesInvoiceWithEInvoiceArchive` → generate from **issued snapshot** → validate → archive |
| Generator | `src/lib/einvoice/**` (CII / ZUGFeRD-oriented); failures **never** roll back issued invoice |
| Older `billing/e-invoice.ts` capability report | Still reports `xmlGenerationEnabled: false` / deferred — **CURRENT_WITH_DRIFT** vs Phase 10 |
| Roadmap doc | Still says structured XML not implemented — **CURRENT_WITH_DRIFT** |
| EN 16931 / XRechnung legal sufficiency | **TAX_ADVISER_REVIEW_REQUIRED** — do not claim certified e-invoicing from engineering alone |

**No e-invoice engineering reopen in this gate.**

---

## 11. Live charging safety (code/config only)

| Control | Behaviour |
|---------|-----------|
| Default | `isMollieLiveChargingEnabled()` false unless env truthy |
| Payment ops | `assertMolliePaymentOpsAllowed()` throws if `live_` key without flag |
| Webhook LIVE | `503` when LIVE key and charging disabled (`api/mollie/webhook/route.ts`) |
| B2C / tax fail-closed | Blocks before payment create |
| Tax evidence | Snapshots on issued invoices |
| Webhook idempotency | `ensureMollieIdempotency` — duplicates return 200 |
| Duplicate invoice | Select-by-payment + unique index on provider tx |

Historical controlled activation documents remain evidence of intended fail-closed posture; **this mission did not enable LIVE charging.**

---

## 12. Counsel / tax boundary

| Item | Label |
|------|-------|
| Seller vs PSP liability / MoR characterisation under DE B2B | `COUNSEL_REVIEW_REQUIRED` |
| Refund / AGB / B2B entrepreneur framing adequacy | `COUNSEL_REVIEW_REQUIRED` |
| VAT model (domestic 19%, EU RC, NON-EU place-of-supply, legends) | `TAX_ADVISER_REVIEW_REQUIRED` |
| Seller VAT ID active registry status | `TAX_ADVISER_REVIEW_REQUIRED` / operator confirm |
| Structured e-invoice obligation vs turnover / profile | `TAX_ADVISER_REVIEW_REQUIRED` |
| Art. 28 DPA / subprocessors (incl. Mollie characterisation) | `COUNSEL_REVIEW_REQUIRED` (also open from compliance pack) |

**Never asserted:** `LEGAL_APPROVED`, `COUNSEL_APPROVED`, `TAX_APPROVED`.

---

## 13. P1-002 blocker standard (applied)

Invented P1 **not** created from: counsel absence alone, stale pre-remediation docs, hypothetical OSS/B2C, e-invoice doc drift, FastSpring historical archive, or LIVE still off.

| Class | Result |
|-------|--------|
| OPEN_P0 | **NONE** |
| ENGINEERING_P1_002 | **NONE** (no proven self-serve path letting unsupported/ambiguous tax reach Mollie LIVE payment create; seller/PSP/tax/invoice architecture coherent) |
| OPERATOR_P1_002 | **NONE** (prior closure: `READY_TO_START_P1_002=YES`) |
| Counsel/tax | **OPEN_SEPARATELY** |

If a future audit proves unsupported buyers can complete LIVE payment create, reopen as `P1_002_ENGINEERING_BLOCKER_FOUND` with file/line/scenario — **not observed here**.

---

## 14. Doc reconciliation performed

| Change | Reason |
|--------|--------|
| This gate artifact created | Mission deliverable |
| `docs/compliance/legal-claims-register.md` claim #18 | Minimal update: FastSpring-as-**current**-active-MoR internal drift already remedited 2026-09-02; mark historical/closed for current-false claims |

No public legal rewrite. No runtime billing edits. No other doc mass rewrite.

---

## 15. Validation

| Suite | Result |
|-------|--------|
| `npm run test:p1-002-pricing-tax` | **PASS** 28/28 |
| `npm run test:eu-b2b-reverse-charge-legend-c3` | **PASS** 12/12 |
| `npm run test:non-eu-b2b-tax-c3-2` | **PASS** 7/7 |
| `p1-002-b2b-runtime-certification.test.mjs` (with TS alias) | **PASS** 10 tests in file / suite green |
| `p1-002-final-hardening.test.mjs` (with TS alias) | **PASS** |
| `npm run test:final-live-billing-gate` | **PASS** 31/31 |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (exit 0; pre-existing unused-var warnings only) |
| `npm run build` | **SKIPPED** — docs-only / no billing runtime change |

---

## 16. Gate decision & open items

### Decision

**`P1_002_ENGINEERING_OPERATOR_GATE_CLOSED_COUNSEL_TAX_REVIEW_OPEN`**

| Field | Value |
|-------|--------|
| `LIVE_B2B_ARCHITECTURE` | **READY** |
| `LIVE_CHARGING_CHANGE_REQUIRED` | **NO** (do not toggle from this gate) |
| `READY_FOR_LEGITIMATE_LIVE_B2B_REVENUE` | **ARCHITECTURE_READY — COUNSEL_TAX_REVIEW_OPEN** (not self-certified legal/tax) |
| `P1_002_ENGINEERING_OPERATOR_GATE` | **CLOSED** |
| `LEGAL_TAX_APPROVAL_INFERRED` | **NO** |

### Concise evidence table

| Topic | Status | Key path |
|-------|--------|----------|
| Active provider | Mollie | `provider.ts` |
| Seller / MoR | ANX seller; Mollie PSP | `legal-content.ts`, catalog, invoices |
| DE B2B 19% | PASS | `tax-policy.ts`, `taxes.ts` |
| EU RC + VIES | PASS fail-closed | `vies.ts`, C3 |
| NON_EU B2B | PASS fail-closed | C3.2 |
| B2C | Blocked | Zod + tax policy |
| Invoice ANX | PASS | `sales-invoice.ts` + RPC |
| Receipt ≠ invoice | PASS | billing history UI |
| LIVE kill switch | FAIL-CLOSED | `mode.ts`, webhook route |
| Counsel/tax | OPEN | external packages / dossier |

### Explicit non-actions

- No payment performed  
- No LIVE charging toggle  
- No counsel remediation  
- No next phase started  
- No push / deploy  
