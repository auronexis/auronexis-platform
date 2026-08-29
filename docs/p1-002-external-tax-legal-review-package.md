# P1-002 External Tax / Legal Review Package

**Status:** TECHNICAL GATE COMPLETE — EXTERNAL REVIEW REQUIRED  
**Superseded for sign-off handoff by:** [`docs/p1-002-external-signoff-dossier.md`](./p1-002-external-signoff-dossier.md)  
**Date:** 2026-08-26 (facts refreshed 2026-08-29 for self-serve tax geography)

**This document is not legal advice, tax advice, or compliance certification.**  
**LIVE charging remains disabled (`MOLLIE_LIVE_CHARGING_ENABLED=false`).**

Related engineering foundations (repository):

- B2B checkout / contracting: commit `bc52df6`
- Tax / invoice readiness: commit `23ae5f5`
- Migration (operator apply, migration-first): `supabase/migrations/20250826100000_sales_invoice_tax_evidence_snapshots.sql`

---

## A. Product / commercial model

| Topic | Current technical fact |
|-------|------------------------|
| Product | Auroranexis — multi-tenant B2B SaaS |
| Customers (intent) | Companies, agencies, MSPs, consultancies, professional / self-employed buyers acting for business purposes |
| Contract seller | Auroranexis operator (legal entity configured in product company information) |
| Payment provider | **Mollie = payment service provider (PSP) only** |
| Merchant of Record | **Not Mollie** — Auroranexis remains the SaaS seller under current architecture |
| Billing model | Recurring subscription (monthly catalog interval for self-serve) |
| Catalog currency | EUR catalog list prices (Professional / Business / Enterprise) |
| Geography (self-serve today) | DE domestic B2B; verified EU B2B Reverse Charge (VIES valid); NON_EU B2B with entrepreneur confirmation — all other uncertain cases block checkout |
| Production mode | Technically verified **controlled** production; LIVE charging **off** |
| B2C / consumer checkout | **Not implemented** as a supported self-serve path |

---

## B. Current technical tax model

Engineering separates **relationship classification** from **final tax outcome**.

### Relationship classes

| Class | Meaning (technical) |
|-------|---------------------|
| `DOMESTIC_B2B` | Buyer country equals seller establishment country (DE) |
| `EU_CROSS_BORDER_B2B_CANDIDATE` | Other EU buyer — *candidate* only |
| `NON_EU_B2B` | Non-EU buyer — category preserved |
| `REVIEW_REQUIRED` | Insufficient evidence for safe self-serve classification |

### Final outcomes (examples)

| Outcome | Self-serve today |
|---------|------------------|
| `STANDARD_DOMESTIC_VAT` | Allowed when domestic B2B evidence satisfied |
| `REVERSE_CHARGE` | Allowed when VAT ID + official VIES `valid` and B2B confirmation present; customer legend uses **implementation-approved** wording (`IMPLEMENTATION_TEXT_APPROVED_FOR_C3`) — **not** external counsel sign-off |
| `NON_EU_B2B_PLACE_OF_SUPPLY` | Allowed when B2B confirmation + non-EU country; implementation legend C3.2 — **not** counsel sign-off |
| `MANUAL_REVIEW` / `UNKNOWN_BLOCK_CHECKOUT` | Fail-closed — checkout blocked |

### Hard fail-closed rules already enforced in code

- Country mismatch alone ≠ Reverse Charge  
- VAT ID existence alone ≠ Reverse Charge  
- Format-valid VAT ≠ officially validated  
- VIES unavailable / timeout / skipped / not_checked ≠ valid  
- Invalid VAT ≠ valid  
- Uncertain treatment ≠ silent 0% / exemption / Reverse Charge  
- Incomplete seller tax configuration blocks auto invoice issuance  

### VAT technical states

`NOT_PROVIDED` · `FORMAT_VALID` · `OFFICIALLY_VALIDATED` · `INVALID` · `REVIEW_REQUIRED`

### Evidence retained (technical)

Organization billing identity (legal name, billing email, country, VAT ID + normalized, VIES status/time), contract acceptances (Terms / B2B acknowledgement / DPA summary / checkout summary versions), and per-invoice tax decision evidence + seller snapshot when invoices are issued.

**Do not tell the adviser what German/EU law requires — ask them to confirm or correct the intended treatment below.**

---

## C. Current invoice model

Auroranexis issues **sales invoices** distinct from Mollie payment receipts.

Structured capabilities:

- Immutable invoice id + human invoice number  
- Issue timestamp + billing/service period fields  
- Seller snapshot at issue (legal name, VAT ID, country, address lines)  
- Buyer snapshot fields (legal name, VAT ID, country)  
- Tax policy outcome + optional business classification  
- Reverse Charge applied flag (only for explicit Reverse Charge outcome)  
- Tax decision evidence JSON (immutable)  
- Line description + net / VAT / gross in integer minor units  
- Currency + Mollie / provider payment references  
- Presentation and exports consume **stored invoice facts**, not live mutable organization fields  

Credit notes: **not implemented** — refunds must not mutate issued invoice totals (accounting process TBD).

E-invoice (XRechnung / ZUGFeRD): **structurally ready** domain; **no XML generator** and no compliance claim.

Additive Production migration for snapshot columns (if not yet applied):  
`20250826100000_sales_invoice_tax_evidence_snapshots.sql` — **MIGRATION_FIRST** before deploying dependent application code.

---

## D. Exact questions for tax adviser

1. Confirm intended **German domestic B2B VAT** treatment for Auroranexis SaaS subscriptions (rate, tax point, VAT-inclusive vs exclusive catalog communication).  
2. Confirm whether current **EUR catalog list-price presentation** (tax confirmed at checkout from billing identity) is acceptable for the intended B2B audience, or whether net/gross wording must change.  
3. Confirm exact technical conditions under which **EU B2B Reverse Charge** may be applied (VAT-ID validation, evidence retention, invoice content).  
4. Confirm what **VAT-ID / VIES evidence** must be retained and for how long.  
5. Confirm required handling when **VIES is temporarily unavailable** (block, retry, manual review).  
6. Confirm treatment of **non-EU B2B** SaaS customers (do not assume 0% / exempt / Reverse Charge).  
7. Provide or approve required **invoice tax legends** (especially Reverse Charge).  
8. Confirm **correction / credit-note** process relative to issued sales invoices and Mollie refunds.  
9. Confirm **e-invoice** obligations/timeline applicable to Auroranexis (if any).  
10. Confirm **seller tax fields** required on every invoice beyond current technical snapshots.

---

## E. Exact questions for legal counsel

1. Review **B2B-only checkout acknowledgement** wording (business/professional purposes; no consumer-rights waiver claim).  
2. Review **Terms** commercial / subscription / renewal / tax clauses for Mollie-PSP / Auroranexis-seller model.  
3. Review **Refund / Cancellation** wording for B2B customers.  
4. Approve exact **Reverse Charge legend** text if Reverse Charge will be used on customer invoices.  
5. Review **DPA / Art. 28** status (summary vs countersigned template).  
6. Review whether current **checkout contract evidence** (versions, timestamps, org, user, plan/price snapshot) is sufficient for contracting.  
7. Confirm any additional **B2B customer disclosures** required before LIVE charging.

---

## F. Explicitly out of scope / not claimed

- No secrets, API keys, or customer VAT records in this package  
- No claim that Cursor or engineering has closed P1-002 overall  
- No authorization to set `MOLLIE_LIVE_CHARGING_ENABLED=true`  
- No claim of MoR transfer to Mollie  
- No claim of e-invoice legal compliance  

---

## G. LIVE charging release gate (operator checklist)

`LIVE_CHARGING_RELEASE = BLOCKED` until **all** of the following are true (operator-owned):

1. P1-002 technical gate complete (this engineering package)  
2. Tax adviser decisions received and integrated where required  
3. Legal counsel decisions received and required copy integrated  
4. Seller configuration complete for Production invoices  
5. Required Production migration(s) verified applied (including tax evidence snapshots if deploying `23ae5f5` writers)  
6. Production regression checks pass  
7. Operator **explicitly** authorizes a separate future enablement action  

Even then, enablement is an **operator** action — not an agent action.
