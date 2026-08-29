# P1-002 External Tax / Legal / Operator Sign-Off Dossier

**Audience:** German tax adviser · legal counsel · operator  
**Repository HEAD at dossier authorship:** `f491af7` (baseline) + objective contradiction remediation commit (see git log)  
**Production app:** https://app.auroranexis.com  
**Public site:** https://www.auroranexis.com (apex redirects)  
**Billing mode:** SAFE CONTROLLED PRODUCTION — `MOLLIE_LIVE_CHARGING_ENABLED` must remain **false**  
**Disclaimer:** This dossier documents **engineering implementation and product behaviour**. It is **not** tax advice, legal advice, GDPR certification, or adviser/counsel approval.

**Categories used below:** `ENGINEERING_VERIFIED` · `TAX_ADVISER_SIGNOFF_REQUIRED` · `LEGAL_COUNSEL_SIGNOFF_REQUIRED` · `OPERATOR_CONFIRMATION_REQUIRED` · `POST_LAUNCH_PROCESS` · `OUT_OF_SCOPE_UNSUPPORTED`

---

## 1. Executive summary

Auroranexis sells B2B SaaS subscriptions as **contractual seller**. **Mollie is PSP only (not Merchant of Record).** Catalog list prices are EUR VAT-inclusive list totals where the tax model permits: **Professional €179 / Business €599 / Enterprise €1,799**.

Engineering tax determination, sales invoicing (`ANX-YYYY-######`), contract acceptance evidence, and customer-facing legal surfaces are **internally coherent enough to hand to external professionals**. Remaining blockers for LIVE charging are **external tax/legal sign-off** and **operator confirmations** — not open engineering P0/P1 defects for this scope.

**Answer to the readiness question:**  
**YES — ready for external P1-002 tax/legal/operator sign-off packages.**  
**NO — not self-certified as tax/legal compliant; LIVE charging not authorized.**

---

## 2. Commercial architecture

| Element | Current product behaviour | Category |
|---------|---------------------------|----------|
| Product | Multi-tenant B2B SaaS (agencies / MSPs) | ENGINEERING_VERIFIED |
| Seller | Auroranexis AI Solutions (Einzelunternehmen / sole proprietorship) | ENGINEERING_VERIFIED / OPERATOR_CONFIRMATION_REQUIRED (registry facts) |
| PSP | Mollie — payment processing only | ENGINEERING_VERIFIED |
| MoR | **Not Mollie** | ENGINEERING_VERIFIED |
| Catalog | EUR minor units in `price-catalog.ts` / `catalog.ts` | ENGINEERING_VERIFIED |
| Self-serve plans | Professional / Business / Enterprise | ENGINEERING_VERIFIED |
| Invite-only | Founding / Pilot (private catalog) | ENGINEERING_VERIFIED |
| LIVE charges | Fail-closed unless `MOLLIE_LIVE_CHARGING_ENABLED=true` | ENGINEERING_VERIFIED |
| Automation entitlement | Professional+ (`ai_automation_builder`) — not reopened here | ENGINEERING_VERIFIED |

---

## 3. Seller / PSP model

**Implementation evidence**

- Terms §11a: payments via Mollie PSP; Auroranexis licenses software access (`src/lib/company/legal-content.ts`).
- Refund policy: Mollie named as PSP, not refund obligor.
- `getActiveBillingProvider()` → `"mollie"` (`src/lib/billing/provider.ts`).
- Catalog header: Auroranexis seller ↔ Mollie PSP (`src/lib/billing/catalog.ts`).
- Production `/terms` and `/refund-policy`: Mollie + “payment service provider”; **zero** “Merchant of Record” hits (HTTP 200 verified 2026-08-29).

**External questions**

- Counsel: confirm seller vs PSP liability allocation (chargebacks, failed payments, cross-border) under German B2B law. → `LEGAL_COUNSEL_SIGNOFF_REQUIRED`
- Tax adviser: confirm VAT remittance remains with Auroranexis as seller under Mollie PSP model. → `TAX_ADVISER_SIGNOFF_REQUIRED`

---

## 4. Seller identity (Impressum / invoice snapshots)

| Field | Configured value | Status |
|-------|------------------|--------|
| Legal name | Auroranexis AI Solutions | CONFIGURED |
| Owner | István-Tamás Schneller | CONFIGURED |
| Form | Einzelunternehmen / Sole proprietorship | CONFIGURED |
| Address | Im Malerwinkel 4, 71566 Althütte, Germany | CONFIGURED |
| VAT ID | DE449657077 | CONFIGURED in product; **active VIES/BZSt status** → OPERATOR_CONFIRMATION_REQUIRED |
| Support / sales | support@auroranexis.com / sales@auroranexis.com | CONFIGURED |
| Seller tax config gate | `getSellerTaxConfiguration()` fail-closes invoice issuance if required fields missing | ENGINEERING_VERIFIED |

Counsel: confirm Impressum sufficiency for this entity type (§5 DDG / MStV). → `LEGAL_COUNSEL_SIGNOFF_REQUIRED`

---

## 5. Supported customer / tax scope

Self-serve checkout requires B2B entrepreneur confirmation and country/VAT evidence as applicable (`determineTaxPolicy` in `src/lib/billing/tax-policy.ts`).

| Scenario | Engineering outcome | Self-serve | Category |
|----------|---------------------|------------|----------|
| **DE B2B** (entrepreneur confirmed) | `STANDARD_DOMESTIC_VAT` @ **19%** (1900 bps), VAT-inclusive split | Allowed | ENGINEERING_VERIFIED + TAX_ADVISER_SIGNOFF_REQUIRED |
| **EU B2B verified** (VAT ID + VIES `valid`) | `REVERSE_CHARGE` @ 0 bps + implementation RC legend | Allowed | ENGINEERING_VERIFIED + TAX_ADVISER_SIGNOFF_REQUIRED + LEGAL_COUNSEL_SIGNOFF_REQUIRED (legend) |
| **EU B2B unverified** (missing VAT / invalid / VIES unavailable / not_checked / skipped) | `UNKNOWN_BLOCK_CHECKOUT` | **Blocked** | ENGINEERING_VERIFIED |
| **NON_EU B2B** (entrepreneur confirmed + non-EU country) | `NON_EU_B2B_PLACE_OF_SUPPLY` @ 0 bps + §3a(2) UStG implementation legend | Allowed | ENGINEERING_VERIFIED + TAX_ADVISER_SIGNOFF_REQUIRED + LEGAL_COUNSEL_SIGNOFF_REQUIRED (legend) |
| **NON_EU without B2B confirmation** | `UNKNOWN_BLOCK_CHECKOUT` | **Blocked** | ENGINEERING_VERIFIED |
| **B2C / consumer** | No supported self-serve path; blocks without entrepreneur confirmation | **Blocked** | ENGINEERING_VERIFIED + LEGAL_COUNSEL_SIGNOFF_REQUIRED (misclassification risk) |

**Fail-closed proofs (engineering)**

- Country mismatch alone ≠ Reverse Charge  
- VAT ID format alone ≠ Reverse Charge  
- VIES fail / timeout / skipped ≠ valid  
- No B2B confirmation ≠ zero-VAT path  
- Incomplete seller tax config ≠ auto invoice  

**Important:** `IMPLEMENTATION_TEXT_APPROVED_FOR_C3` / `C3_2` are **engineering** legend gates — **not** external counsel sign-off.

---

## 6. Unsupported / fail-closed / out of scope

| Topic | Status |
|-------|--------|
| EU B2C / OSS consumer VAT | `OUT_OF_SCOPE_UNSUPPORTED` / blocked |
| Foreign (non-DE) VAT registration / remittance | `OUT_OF_SCOPE_UNSUPPORTED` until adviser decides |
| Automated credit notes | Not implemented → `POST_LAUNCH_PROCESS` + tax adviser |
| XRechnung / ZUGFeRD / EN 16931 XML | Domain scaffold only; **no XML generator**; PDF only → `OUT_OF_SCOPE_UNSUPPORTED` for structured e-invoice go-live |
| Self-serve plan override by customer | Not supported; `DEV_FORCE_PLAN` ignored in production | ENGINEERING_VERIFIED |
| Mollie as MoR | Not implemented | ENGINEERING_VERIFIED |

---

## 7. Invoice architecture

| Capability | Behaviour | Evidence class |
|------------|-----------|----------------|
| Domain | Auroranexis `sales_invoices` ≠ Mollie payment receipt | ENGINEERING_VERIFIED |
| Numbering | DB RPC `allocate_sales_invoice_number` → `ANX-YYYY-######` | ENGINEERING_VERIFIED |
| Preview | In-memory `TEST-ANX-…` / synthetic buyers; **does not** call allocator | ENGINEERING_VERIFIED |
| Seller / buyer / tax snapshots | Persisted at issue; presentation reads snapshots | ENGINEERING_VERIFIED |
| PDF | Implemented (`sales-invoice-pdf.ts`) | ENGINEERING_VERIFIED |
| Email | Customer invoice email path (support/noreply rules; sales@ not From) | ENGINEERING_VERIFIED |
| Idempotency | Skip if `provider_transaction_id` already invoiced | ENGINEERING_VERIFIED |
| Contacts | support@ / sales@ from `company-contact.ts` | ENGINEERING_VERIFIED |

---

## 8. Representative invoice scenarios (SAFE preview only)

Operator route: `/settings/billing/invoice-preview` — fake buyers, **no** production number consumption, **no** LIVE charges.

| Scenario | Expected engineering presentation |
|----------|-----------------------------------|
| DE B2B Business | Gross €599.00; net/VAT split at 19%; note “German VAT (19%)”; number `TEST-ANX-…` |
| EU B2B FR/NL RC | Gross = catalog; VAT 0; legend includes “Reverse charge” |
| NON_EU B2B (e.g. US/CH/GB) | Gross = catalog; VAT 0; NON_EU place-of-supply legend (not EU RC wording) |
| Negative / unsupported | Unverified EU / no B2B confirmation → block (no zero-VAT self-serve) |

---

## 9. Contract acceptance

| Control | Implementation |
|---------|----------------|
| Signup | Terms + entrepreneur checkboxes; server Zod requires `true` (`auth/actions.ts`) |
| Checkout | Contract summary dialog; Terms + B2B + DPA evidence; tax determination before Mollie redirect (`billing/actions.ts`) |
| Versions | `TERMS_DOCUMENT_VERSION` / `DPA_DOCUMENT_VERSION` persisted (`contracting.ts`) |
| DPA page | Public Art. 28 **summary**; full countersigned template status `LEGAL_TEXT_PENDING_COUNSEL` (internal) |
| Checkboxes | Not pre-checked |

Counsel: confirm evidence sufficiency and DPA summary vs countersigned Art. 28 for enterprise procurement. → `LEGAL_COUNSEL_SIGNOFF_REQUIRED`

---

## 10. Refunds / cancellation / proration

| Topic | Product behaviour | Category |
|-------|-------------------|----------|
| Refunds | No customer self-serve refund button; requests via support@; operator Mollie Dashboard/API | POST_LAUNCH_PROCESS + LEGAL_COUNSEL_SIGNOFF_REQUIRED |
| Accounting correction | No automated credit-note mutation of issued invoices | MANUAL_REQUIRED + TAX_ADVISER_SIGNOFF_REQUIRED |
| Cancellation | Cancel at period end; paid-through access; withdrawal recreates lifecycle (Mollie reactivation unsupported) | ENGINEERING_VERIFIED |
| Public wording | Terms §12–14 + Refund policy align with cancel ≠ refund | ENGINEERING_VERIFIED + LEGAL_COUNSEL_SIGNOFF_REQUIRED |
| Proration | Upgrade proration implemented for catalog amounts; Terms point to billing settings workflow | ENGINEERING_VERIFIED + LEGAL_COUNSEL_SIGNOFF_REQUIRED (disclosure depth) |

---

## 11. Retention

| Topic | Behaviour | Category |
|-------|-----------|----------|
| Client archive | Supported (`archiveClientAction`) | ENGINEERING_VERIFIED |
| Client hard delete | Owner/admin only; requires prior archive; org-scoped | ENGINEERING_VERIFIED |
| Accounting independence | `sales_invoices` are organization-scoped, not deleted by client hard-delete | ENGINEERING_VERIFIED |
| Statutory retention periods | Product retention rules are operational scaffolding | TAX_ADVISER_SIGNOFF_REQUIRED + LEGAL_COUNSEL_SIGNOFF_REQUIRED |

---

## 12. E-invoice readiness

| Item | Status |
|------|--------|
| PDF sales invoice | YES — implemented |
| XRechnung XML | NO |
| ZUGFeRD | NO |
| EN 16931 structured output | NO |
| Domain readiness note | Scaffold exists; generator deferred (`e-invoice.ts`) |
| External tax review | REQUIRED (obligation/timeline vs turnover) |

---

## 13. Legal surfaces (customer-facing)

Production HTTP 200 verified (2026-08-29) for: `/pricing`, `/terms`, `/privacy`, `/imprint`, `/refund-policy`, `/data-processing-agreement`, `/subprocessors`.

| Surface | Engineering status for external review |
|---------|----------------------------------------|
| Terms | READY_FOR_EXTERNAL_REVIEW |
| Privacy | READY_FOR_EXTERNAL_REVIEW |
| DPA (summary) | READY_FOR_EXTERNAL_REVIEW (full countersigned text still counsel-gated) |
| Refund policy | READY_FOR_EXTERNAL_REVIEW |
| Subprocessors | READY_FOR_EXTERNAL_REVIEW (inventory aligned to SMTP/analytics/Sentry facts in remediation) |

Prices on production `/pricing` match catalog (€179 / €599 / €1,799; EUR; no USD/FastSpring/Stripe).

---

## 14. Tax adviser checklist

1. Confirm DE domestic B2B SaaS VAT treatment (19%, tax point, VAT-inclusive catalog communication).  
2. Approve or correct EU B2B Reverse Charge conditions (VIES evidence, retention, invoice content).  
3. Approve or replace Reverse Charge legend text (current implementation English/German constants).  
4. Confirm NON_EU B2B place-of-supply treatment and §3a(2) UStG legend.  
5. Confirm fail-closed handling when VIES unavailable.  
6. Confirm credit-note / correction process vs Mollie refunds.  
7. Confirm e-invoice obligations/timeline (PDF-only today).  
8. Confirm seller fields required on every invoice beyond current snapshots.  
9. Confirm VAT ID DE449657077 usage on invoices matches registration.  
10. Confirm any OSS / B2C obligations if consumers ever slip through despite B2B gates.

---

## 15. Legal counsel checklist

1. Review B2B-only entrepreneur acknowledgement (no consumer-rights waiver claim).  
2. Review Terms commercial / renewal / cancellation / tax / Mollie-PSP clauses.  
3. Review Refund / Cancellation policy enforceability for intended B2B audience.  
4. Approve invoice legends (EU RC + NON_EU) or supply replacement copy.  
5. Review DPA summary vs need for countersigned Art. 28 template.  
6. Review contract acceptance evidence (versions, timestamps, org, user, plan snapshot).  
7. Confirm Impressum / entity disclosures for Einzelunternehmen.  
8. Confirm subprocessors / privacy / cookies disclosures after inventory update.  
9. Confirm any additional pre-LIVE disclosures required.

---

## 16. Operator checklist

1. Keep `MOLLIE_LIVE_CHARGING_ENABLED=false` until **after** recorded tax + legal sign-off and a separate LIVE gate.  
2. Confirm Production Vercel env: LIVE charging false; Mollie rollout as intended; no legacy provider keys driving checkout.  
3. Confirm VAT ID DE449657077 active in VIES/BZSt.  
4. Confirm SMTP/STRATO production email path and mailbox ownership (support@ / sales@ / noreply@).  
5. Confirm Production migrations for sales invoices / tax evidence / allocator grants applied (prior migration certification artifacts).  
6. Confirm seller identity on live invoices matches commercial registry.  
7. Do **not** enable LIVE charging from this dossier alone.  
8. Record external sign-off artifacts in release checklist when received.

---

## 17. Known limitations (explicit)

- No automated credit notes.  
- No XRechnung/ZUGFeRD.  
- DPA full countersigned text not published (summary only).  
- Invoice legends are implementation-approved, not counsel-approved.  
- Historical internal docs (`docs/pricing-assumptions.md`, older phase reports) may show legacy prices/providers — **not** customer-facing; catalog + public site are authoritative.  
- `maybeIssueSalesInvoiceForPaidMolliePayment` assumes B2B confirmation already enforced at checkout (does not re-query acceptances).  
- Controlled TEST/pilot charging ≠ unrestricted LIVE commercial charging.

---

## 18. Evidence references (non-exhaustive)

| Area | Primary paths |
|------|----------------|
| Catalog / prices | `src/lib/billing/price-catalog.ts`, `catalog.ts`, `plans.ts` |
| Tax policy | `src/lib/billing/tax-policy.ts`, `tax-classification.ts`, `vies.ts` |
| Invoices | `sales-invoice.ts`, `sales-invoice-from-mollie.ts`, `sales-invoice-preview.ts`, `sales-invoice-pdf.ts` |
| Legends | `reverse-charge-legend.ts`, `non-eu-b2b-legend.ts` |
| Contracting | `contracting.ts`, `contract-acceptance.ts`, `billing/actions.ts`, `signup-form.tsx` |
| Legal copy | `src/lib/company/legal-content.ts`, `company-information.ts`, `company-contact.ts` |
| Mollie gate | `providers/mollie/rollout.ts`, `mode.ts`, webhook route |
| Prior packages | `docs/p1-002-external-tax-legal-review-package.md`, `docs/p1-002-remediation-pricing-tax-invoice-contracting.md` |

---

## 19. Remediation applied in this sign-off pass (engineering only)

Objective factual mismatches fixed (no substantive legal rewrite of policy judgments):

- README still claimed FastSpring MoR → corrected to Mollie PSP / Auroranexis seller.  
- Stale FastSpring “sole active” comments / billing overview default → Mollie.  
- Subprocessors inventory understated SMTP/analytics/Sentry relative to Privacy + production email path → aligned.

---

## 20. Final external-signoff status

| Gate | Status |
|------|--------|
| Engineering coherence for external handoff | **PASS** |
| External tax adviser sign-off | **REQUIRED — OPEN** |
| External legal counsel sign-off | **REQUIRED — OPEN** |
| Operator confirmations | **REQUIRED — OPEN** |
| `MOLLIE_LIVE_CHARGING_ENABLED` | **false** (must remain) |
| LIVE charging authorized by this dossier | **NO** |
| Verdict for handoff | **P1_002_READY_FOR_EXTERNAL_SIGNOFF** |

P1-002 remains **OPEN** until professionals and operator record sign-off. This document prepares that review; it does **not** close it.
