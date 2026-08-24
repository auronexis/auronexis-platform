# P1-002 Remediation — Pricing, Tax, Invoice & B2B Contracting

**Date:** 2026-08-24  
**Scope:** Implementable engineering remediation from `docs/p1-002-de-eu-legal-tax-certification.md`  
**LIVE charging:** `MOLLIE_LIVE_CHARGING_ENABLED` remains default-off / fail-closed  
**Billing role:** Auroranexis seller; Mollie PSP (not MoR)

---

## Executive verdict

**TECHNICAL REMEDIATION: COMPLETE (implementable scope)**  
**LIVE REVENUE: STILL HOLD** — external legal counsel + tax adviser sign-off remain required (P1-002-001 and tax/legal gates).

Controlled Mollie TEST pilot remains allowed with LIVE charging off.

---

## What was implemented

### Price & currency
- Versioned EUR catalog (`src/lib/billing/price-catalog.ts`): Professional **17900**, Business **59900**, Enterprise **179900** minor units.
- `SUBSCRIPTION_PLANS` / display / marketing / Terms copy switched to **EUR VAT-inclusive list** (catalog total = customer total where tax model permits).
- Multi-currency scaffold for USD/GBP/CHF with **empty** production price slots (no invented prices).
- Display currency (`organizations.currency`) remains independent; subscription `billing_currency` / `catalog_amount_minor` / `catalog_price_version` columns added.
- Transaction currency resolution refuses silent EUR when a payment currency is present; no USD→EUR reinterpretation of historical rows.

### Tax
- Determination (`tax-policy.ts`) separated from calculation (`taxes.ts`).
- Outcomes: `STANDARD_DOMESTIC_VAT` | `REVERSE_CHARGE` | `ZERO_RATE_IF_LEGALLY_APPLICABLE` | `TAX_EXEMPT_IF_LEGALLY_APPLICABLE` | `MANUAL_REVIEW` | `UNKNOWN_BLOCK_CHECKOUT`.
- DE domestic uses **19%** (1900 bps) VAT-inclusive split — replaces flat 20% placeholder.
- `UNKNOWN` / failed VIES **never** silently becomes 0% self-serve.
- EU reverse-charge determination exists but **blocks self-serve checkout** until counsel-approved invoice legend (`LEGAL_TEXT_PENDING_COUNSEL` internal-only).
- VIES abstraction (`vies.ts`) server-only; transport failure → `unavailable` (fail ≠ valid).

### Invoicing
- Auroranexis `sales_invoices` domain (Net, VAT %, VAT amount, Total) distinct from Mollie payment receipts.
- Best-effort issuance after paid Mollie sync for domestic STANDARD_DOMESTIC_VAT path.
- Billing history UI clarifies Mollie link = payment receipt; sales invoice number when present.
- E-Invoice: domain model + capability report; **XML generator deferred** (no fake XRechnung/ZUGFeRD).

### Contracting
- Signup: entrepreneur + Terms/DPA checkboxes (not pre-checked); acceptance evidence persisted.
- Checkout: contract summary dialog before Mollie redirect; country/VAT capture; Terms + B2B + DPA version evidence.
- DPA full Art. 28 countersigned text remains counsel-gated internally (`LEGAL_TEXT_PENDING_COUNSEL`).

### Legacy provider scrub (customer-facing)
- `/docs` operations Stripe billing copy → Mollie.
- `docs/billing.md` FastSpring-only → Mollie-only.
- Marketing/legal USD catalog copy → EUR.
- Historical FastSpring/Paddle/Stripe archive modules remain internal/diagnostic only.

---

## Migrations

`supabase/migrations/20250824100000_p1_002_pricing_tax_invoice_contracting.sql` (additive):
- `organization_subscriptions.billing_currency|catalog_price_version|catalog_amount_minor`
- `organization_billing_identities` (+ RLS)
- `organization_contract_acceptances` (+ RLS)
- `sales_invoices` (+ RLS)
- `allocate_sales_invoice_number` (service_role)

---

## External decisions still required

| Item | Owner |
|------|--------|
| Counsel sign-off MoR/tax/refund/B2B AGB | Legal |
| Tax adviser VAT model (OSS, reverse-charge legends, rate tables) | Tax |
| Counsel-approved reverse-charge invoice wording | Legal + Tax |
| Countersigned Art. 28 DPA template | Legal |
| E-Invoice library selection / go-live timing vs turnover | Tax + Eng |
| Operator: confirm VAT ID DE449657077 active in VIES/BZSt | Ops |

---

## Quality gates

Recorded in commit / parent response after local run. LIVE gate must remain fail-closed.

---

## Non-goals preserved

- Did not enable LIVE charging
- Did not invent reverse-charge customer wording
- Did not claim E-Invoice XML compliance
- Did not FX-convert historical USD transactions to EUR
- Did not add VAT on top of catalog (VAT-inclusive principle)
