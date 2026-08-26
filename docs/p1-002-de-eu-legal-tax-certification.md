# P1-002 — DE/EU Legal, Tax & Privacy Certification Audit

**Platform:** Auroranexis B2B SaaS  
**Repository:** `D:\Projekt.01\Auroranexis`  
**Audit date:** 2026-08-24 (UTC+2)  
**Auditor mode:** Read-only certification — no code, legal copy, billing, or config changes  
**Parent context:** `docs/final-production-certification-audit-v1.md` (P1-002)  
**Billing state:** Mollie sole active provider; `MOLLIE_LIVE_CHARGING_ENABLED=false` (default-off, not modified in this pass)  
**Prior findings:** P1-001, P1-003, P1-004 marked CLOSED in operator state (this audit does not re-verify production env runtime)

**Disclaimer:** This report is an engineering and documentation audit. It is **not** legal advice, tax advice, or a claim of regulatory compliance. Findings use the evidence classes: **TECHNICALLY VERIFIED** | **DOCUMENT VERIFIED** | **OFFICIAL SOURCE VERIFIED** | **EXTERNAL LEGAL REVIEW REQUIRED** | **EXTERNAL TAX REVIEW REQUIRED** | **NOT VERIFIED**.

---

## A. Executive verdict

### **PARTIAL — NOT READY FOR LIVE REVENUE (legal/tax/privacy gate)**

Customer-facing legal pages, Mollie PSP positioning, and subscription lifecycle copy are **largely aligned** after the FastSpring retirement scrub. **No customer-facing Merchant-of-Record (MoR) claims** for Mollie or FastSpring were found in `src/`. Mollie is correctly described as payment service provider (PSP), while **Auroranexis remains the contractual seller** of software access.

**Blocking gaps for LIVE revenue promote (this audit):**

| Gate | Status |
|------|--------|
| External legal counsel sign-off on MoR/tax/refund wording under Mollie | **NOT VERIFIED** |
| External tax adviser sign-off on VAT model (domestic DE, EU B2B reverse charge, OSS/B2C if any) | **NOT VERIFIED** |
| VAT ID collection + VIES validation at checkout | **NOT VERIFIED** (no implementation found) |
| Compliant B2B invoice issuance (incl. German E-Rechnung roadmap) | **NOT VERIFIED** |
| Explicit B2B entrepreneur confirmation at signup/checkout | **NOT VERIFIED** |
| Signed / complete Art. 28 GDPR DPA for enterprise procurement | **EXTERNAL LEGAL REVIEW REQUIRED** |

**Controlled TEST pilot (Mollie `test_` key, LIVE charging off):** **ALLOWED** subject to operator env checks (P1-001/P1-004 closed elsewhere) and staging smoke — **not blocked by this audit** provided no LIVE charges occur.

**This audit did not:** enable LIVE charging, modify Terms/Privacy/Refund/Impressum, push, deploy, or create real charges.

---

## B. Contract surface map

All routes verified from repository source (`src/lib/company/company-links.ts`, App Router pages, legal content module). Runtime browser walkthrough: **NOT VERIFIED**.

| Surface | Route(s) | Legal/commercial role | Source |
|---------|----------|----------------------|--------|
| Homepage | `/` | Marketing, org schema, pricing funnels | `src/app/(marketing)/page.tsx` |
| Pricing | `/pricing` | USD catalog prices; taxes “confirmed at checkout” | `src/lib/marketing/content.ts`, `pricing-grid.tsx` |
| Enterprise | `/enterprise` | Custom sales; no self-serve checkout | `MARKETING_ROUTES.enterprise` |
| Pilot program | `/pilot-program` | Invite-only; limited availability schema | `company-schema.ts` |
| Signup | `/signup` | Account creation; footer legal links only | `signup-form.tsx` — **no terms/B2B checkbox** |
| Login / password reset | `/login`, `/forgot-password`, `/reset-password` | Auth; legal links in footer | Auth layout |
| Plans (in-app) | `/settings/plans` | Plan selection → Mollie checkout | Dashboard |
| Billing settings | `/settings/billing` | Cancel, upgrade, downgrade, withdrawal, history | `billing-settings-panel.tsx`, `billing-mollie-management-panel.tsx` |
| Mollie return | `/settings/billing/mollie/return` | Non-authoritative status display | `return-state.ts` |
| Terms (AGB) | `/terms`, `/legal/terms` | B2B-only, renewal, cancellation, Mollie PSP | `legal-content.ts` |
| Privacy | `/privacy`, `/legal/privacy` | GDPR controller/processor split, Mollie, analytics consent | `legal-content.ts` |
| Impressum | `/imprint` | §5 DDG provider ID, VAT ID, owner | `legal-content.ts` |
| Refund policy | `/refund-policy` | Non-refund default for business; Mollie PSP | `legal-content.ts` |
| Cookies | `/cookies` | Consent categories (Plausible, Clarity, PostHog, GA4) | `legal-content.ts` |
| DPA | `/data-processing-agreement` | Art. 28 summary incorporated in Terms | `legal-content.ts` |
| Sub-processors | `/subprocessors` | Supabase, Vercel, Mollie, Resend, OpenAI | `legal-content.ts` |
| Security / AUP | `/security-policy`, `/acceptable-use` | Security + use rules | `legal-content.ts` |
| Compliance marketing | `/compliance` | Product compliance positioning | Marketing |
| FAQ | `/faq` | Mollie billing FAQ | `faq-content.ts` |
| Client portal legal | `/client-portal/.../legal` | Links to public legal pages | Portal |
| Dashboard legal hub | `/dashboard/legal`, `/settings/legal` | In-app legal links | Dashboard |
| Transactional email | SMTP (production path) | Purchase, cancellation, plan-change notices | `src/lib/email/templates/*` |
| Invoice/receipt UI | Settings → Billing history | PDF link from stored `invoice_url` | `billing-history-panel.tsx` |
| Webhook (authoritative) | `POST /api/mollie/webhook` | Entitlement + transaction sync | `webhooks.ts` |
| Legacy stubs | `/api/fastspring/*` → 410 | Retired; no customer checkout | Consolidation report |

**Public SEO:** Dashboard, settings, API, auth routes use noindex contracts (Chapter 8 regression) — **DOCUMENT VERIFIED**.

---

## C. Mollie role — PSP, not Merchant of Record

### Conclusion (OFFICIAL SOURCE VERIFIED)

**Mollie is a licensed payment service provider (PSP), not the Merchant of Record for Auroranexis subscription sales.** Auroranexis (`Auroranexis AI Solutions`, Einzelunternehmen, DE) sells software access; Mollie processes payment transactions on the merchant’s account.

| Source | Access date | Finding |
|--------|-------------|---------|
| [Mollie User Agreement](https://www.mollie.com/legal/user-agreement) | 2026-08-24 | Merchant “solely responsible for assessing, collecting, reporting, and remitting taxes”; rates exclude VAT unless stated |
| [Mollie Invoicing Terms](https://www.mollie.com/legal/mollie-invoicing-terms) | 2026-08-24 | Invoice accuracy and VAT rates “lie solely with you”; Mollie does not verify merchant tax settings |
| [Mollie Connect Balance Transfers docs](https://docs.mollie.com/docs/connect-platforms-balance-transfers) | 2026-08-24 | Must not “act as merchant of record for others” — platform pass-through prohibited |
| [Mollie Help — bookkeeping](https://help.mollie.com/hc/en-gb/articles/360018425879) | 2026-08-24 | Mollie settlements ≠ sales VAT invoices; recommends external bookkeeping |

**Repository alignment (DOCUMENT VERIFIED):**

- Terms §11a: “Payments … processed securely through our payment service provider, Mollie. Auroranexis supplies and licenses software access.” — `src/lib/company/legal-content.ts`
- Refund policy §2: Mollie named as PSP, not refund obligor — same file
- Privacy / subprocessors: Mollie listed as payment processor — same file
- Consolidation report: FastSpring MoR wording removed; `LEGAL_REVIEW_REQUIRED` retained — `docs/mollie-provider-consolidation-final.md`
- **`src/` grep:** zero hits for “Merchant of Record” / “merchant of record” / “MoR” — **TECHNICALLY VERIFIED**

**EXTERNAL LEGAL REVIEW REQUIRED:** Counsel confirmation that English AGB + refund wording correctly allocates seller vs PSP liabilities (chargebacks, failed payments, cross-border buyers) under German B2B law.

---

## D. Company identity & Impressum

| Element | Published value | Status |
|---------|-----------------|--------|
| Legal name | Auroranexis AI Solutions | **DOCUMENT VERIFIED** — `company-information.ts` |
| Form | Einzelunternehmen / Sole proprietorship | **DOCUMENT VERIFIED** |
| Owner | István-Tamás Schneller | **DOCUMENT VERIFIED** |
| Address | Im Malerwinkel 4, 71566 Althütte, Germany | **DOCUMENT VERIFIED** |
| VAT ID | DE449657077 (§27a UStG cited) | **DOCUMENT VERIFIED** — not validated against BZSt in this audit |
| Phone | +49 7183 4285291 | **DOCUMENT VERIFIED** |
| Emails | support@, legal@, security@, noreply@ | **DOCUMENT VERIFIED** |
| Content responsible | §18(2) MStV line present | **DOCUMENT VERIFIED** |
| EU ODR | Obsolete EC ODR platform claim removed (Reg. 2024/3228); B2B consumer-arbitration non-participation retained | **DOCUMENT VERIFIED** |
| Handelsregister / HRB | Not published | **EXTERNAL LEGAL REVIEW REQUIRED** — Einzelunternehmen may omit HRB; counsel to confirm sufficiency under §5 DDG for this entity type |
| Last updated | August 23, 2026 | **DOCUMENT VERIFIED** |

**NOT VERIFIED:** Whether published VAT ID is active in VIES/BZSt at audit time (operator registry check).

---

## E. B2B positioning & contract formation

### B2B-only positioning

- Terms §3: exclusive to entrepreneurs (§14 BGB); consumer contracts excluded — **DOCUMENT VERIFIED**
- Impressum: B2B platform for agencies/MSPs — **DOCUMENT VERIFIED**
- Privacy scope: business customers — **DOCUMENT VERIFIED**
- Refund §8: consumer withdrawal excluded for entrepreneur-only supply — **DOCUMENT VERIFIED**

### Gaps (findings)

| Issue | Evidence | Severity | Remediation class |
|-------|----------|----------|-------------------|
| No explicit entrepreneur checkbox at signup | `signup-form.tsx` — fields only: name, agency, email, password; no §14 BGB attestation | **P1** | **EXTERNAL LEGAL REVIEW** + **ENGINEERING FIX** (if counsel requires) |
| No terms acceptance checkbox at signup | `signUp` action accepts no `termsAccepted` field — `auth/actions.ts` | **P1** | **EXTERNAL LEGAL REVIEW** + **ENGINEERING FIX** |
| Terms §4: contract on “registration and accept Terms” vs signup UX | Legal text claims acceptance; UI does not capture it | **P1** | **DOCUMENT FIX** or **ENGINEERING FIX** (counsel-led) |
| No separate checkout terms step before Mollie redirect | `pricing-grid.tsx` redirects to Mollie URL directly | **P2** | **EXTERNAL LEGAL REVIEW** — may be acceptable if first payment = acceptance per §4 second limb |

**OFFICIAL SOURCE (Tier 2 professional):** Händlerbund guidance recommends visible B2B-only positioning + non-pre-checked entrepreneur checkbox for online B2B shops ([Händlerbund Verbraucherausschluss](https://www.haendlerbund.de/de/news/aktuelles/wissenssnack/verbraucherausschluss-b2b-handel), accessed 2026-08-24). **SOURCE CONFLICT:** None with repo; implementation gap only.

**German B2B automatic renewal:** B2B renewal clauses generally permissible if transparent (§307 BGB fairness); consumer §309 Nr. 9 / §312k Kündigungsbutton rules do not apply to pure B2B — **OFFICIAL SOURCE VERIFIED** (professional summary + BGH consumer cases distinguish B2C). **EXTERNAL LEGAL REVIEW REQUIRED** for sole proprietorship buyers who may qualify as consumers.

---

## F. Subscription lifecycle consistency

| Topic | Terms | Refund policy | Billing UI | Email templates | Verdict |
|-------|-------|---------------|------------|-----------------|---------|
| Auto-renewal | §12 | §2 | Renewal date in management panel | Withdrawal email mentions mandate at renewal | **DOCUMENT VERIFIED** |
| Cancel at period end | §13 | §3 | `cancelMollieSubscriptionAction`, dialog copy | Cancellation scheduled / ended templates | **TECHNICALLY VERIFIED** (code present) |
| Cancellation ≠ refund | §14 | §3–§4 | UI copy | — | **DOCUMENT VERIFIED** |
| Upgrade / downgrade | §12 | — | Scheduled change cancel; pricing grid | Plan change canceled template | **TECHNICALLY VERIFIED** |
| Withdrawal of cancellation | — | — | `withdrawMollieSubscriptionAction` | Dedicated template | **TECHNICALLY VERIFIED** |
| Paid-through access after cancel | §13 | §3 | `isPaidThrough` gating | Emails state access until period end | **DOCUMENT VERIFIED** |

**Runtime end-to-end (Mollie TEST LIVE flow):** **NOT VERIFIED** in this audit.

**Mollie limitation (DOCUMENT VERIFIED):** `MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false` — withdrawal recreates lifecycle via new flow, documented in code comments; aligns with email “no charge today” copy.

---

## G. Refund policy vs platform capability

| Policy statement | Implementation | Status |
|------------------|----------------|--------|
| Business customers: current period generally non-refundable | No self-service refund button in billing UI | **CONSISTENT — DOCUMENT VERIFIED** |
| Refund requests via support@ | Email-only; operator review | **CONSISTENT — OPERATIONAL PROCESS** |
| Approved refunds to original payment method | No automated Mollie refund API in customer path; consolidation doc: operator Mollie Dashboard/API | **CONSISTENT — OPERATIONAL PROCESS** |
| Duplicate/error/unauthorized review | Support process; `paid-purchase-recovery.ts` for activation failures, not auto-refund | **TECHNICALLY VERIFIED** |
| Mollie as PSP only | No policy assigns refund obligation to Mollie | **DOCUMENT VERIFIED** |

**P2 observation:** Billing history shows payment rows; no “Request refund” affordance — intentional per policy, not a contradiction.

**EXTERNAL LEGAL REVIEW REQUIRED:** Whether non-refund clause is enforceable for all customer types (EU B2B, occasional consumer misclassification, 14-day digital content rules if consumer).

---

## H. VAT & tax model

### Published commercial position

- Pricing page / Terms §11: USD list prices; “final amounts and applicable taxes confirmed at checkout” — **DOCUMENT VERIFIED**
- Impressum publishes seller VAT ID DE449657077 — **DOCUMENT VERIFIED**

### Implementation (TECHNICALLY VERIFIED — gaps)

| Capability | Finding | Location |
|------------|---------|----------|
| VAT rate logic | Hardcoded `DEFAULT_VAT_RATE = 0.2` (20%) for all countries | `src/lib/billing/taxes.ts` |
| VIES validation | **Not implemented** — no `VIES`, `vatId`, `reverse charge` in billing checkout path | repo search |
| Customer VAT ID capture | **Not implemented** at signup or checkout | — |
| EU B2B reverse charge (Art. 196) | **Not implemented** — no invoice legend, no 0% cross-border B2B path | — |
| OSS / B2C EU VAT | **Not implemented** | — |
| Mollie payment tax breakdown | `amount_tax` column exists in DB schema but **not populated** in `upsertMollieBillingTransaction` | `transactions.ts` vs migration `20250718160000_*` |
| Currency | Catalog USD; Mollie sync stores currency lowercased (defaults `eur` if null) | `transactions.ts` |

### External tax framework (OFFICIAL SOURCE VERIFIED)

| Rule | Source | Access date |
|------|--------|-------------|
| B2B cross-border EU electronic services → reverse charge if valid VAT number (Art. 44, 196 Directive 2006/112/EC) | [EUR-Lex VAT Directive framework](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32006L0112) (via professional summaries); VIES expected | 2026-08-24 |
| Domestic DE B2B | German standard VAT rate applies to taxable SaaS (currently 19% — **implementation uses 20% placeholder**) | **EXTERNAL TAX REVIEW REQUIRED** — rate mismatch |
| Merchant responsible for tax when using Mollie PSP | Mollie User Agreement § tax responsibility | 2026-08-24 |

**P1 finding — P1-002-VAT-001:** Tax engine is a **placeholder** (20% flat), not a production DE/EU VAT model. **Remediation:** **EXTERNAL TAX REVIEW REQUIRED** then **ENGINEERING FIX** (VIES, rate tables, reverse-charge invoices, OSS if B2C).

**SOURCE CONFLICT:** None between Mollie docs and EU VAT law; conflict between **code (20%)** and **German statutory rate (19%)** — treat as **implementation defect** pending tax adviser confirmation.

---

## I. Invoicing & German E-Rechnung readiness

### Current invoice pipeline (TECHNICALLY VERIFIED)

1. Mollie webhook sync stores `invoice_url` from `payment._links.checkout.href` (checkout/receipt link, not structured invoice) — `webhooks.ts`, `transactions.ts`
2. `invoice_number`, `amount_tax` columns exist but are **not set** in Mollie upsert path
3. Billing history “PDF” opens stored URL via `openInvoicePdfAction` — no server-side PDF generation
4. **No** XRechnung, ZUGFeRD, EN 16931, or Peppol integration found in codebase
5. Mollie Sales Invoices API / Invoicing product **not wired** in application code

### German B2B E-Rechnung law (OFFICIAL SOURCE VERIFIED)

| Milestone | Requirement | Source | Access date |
|-----------|-------------|--------|-------------|
| From 2025-01-01 | All domestic businesses must **receive** EN 16931-compliant e-invoices | [BMF Schreiben 2025-10-15 (PDF)](https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-10-15-einfuehrung-obligatorische-e-rechnung.pdf) | 2026-08-24 |
| 2025–2026 transition | Issuance of “sonstige Rechnungen” (e.g. PDF) may continue with recipient consent | BMF / [BStBK FAQ E-Rechnung (PDF)](https://www.bstbk.de/downloads/bstbk/steuerrecht-und-rechnungslegung/fachinfos/BStBK_FAQ_E-Rechnung_final.pdf) | 2026-08-24 |
| From 2027-01-01 | **Issuance** mandatory for businesses with prior-year turnover > €800,000 | BStBK FAQ | 2026-08-24 |
| From 2028-01-01 | Issuance mandatory for remaining domestic businesses (exceptions per law) | BStBK FAQ | 2026-08-24 |
| Accepted formats | XRechnung, ZUGFeRD ≥2.0.1 (EN 16931 profiles), agreed EDI | BMF Schreiben | 2026-08-24 |

**P1 finding — P1-002-EINV-001:** Application does not issue structured B2B invoices. **Remediation:** **EXTERNAL TAX REVIEW REQUIRED** (timing vs turnover) + **OPERATIONAL PROCESS** (interim PDF + consent) + **ENGINEERING FIX** (XRechnung/ZUGFeRD or Mollie Invoicing API integration).

**P2 finding — P1-002-EINV-002:** Labeling Mollie checkout links as “invoice PDF” in UI may mislead finance teams — **DOCUMENT FIX** / **ENGINEERING FIX** (counsel-led labeling).

---

## J. GDPR role mapping & DPA

| Role | Scope | Evidence | Status |
|------|-------|----------|--------|
| Controller | Account, billing contact, website visitor data | Privacy policy “Data controller” card | **DOCUMENT VERIFIED** |
| Processor | Customer-uploaded client/staff data in workspace | Terms §15, DPA page | **DOCUMENT VERIFIED** |
| Joint controller | Not claimed | — | **N/A** |
| Mollie | Separate controller/processor for payment data | Privacy subprocessors section | **DOCUMENT VERIFIED** (detail: **EXTERNAL LEGAL REVIEW**) |

### Art. 28 DPA adequacy (OFFICIAL SOURCE VERIFIED + gap analysis)

EDPB Guidelines 07/2020 require DPA to include specific processing details, security measures, sub-processor rules, audit rights — not merely restate Art. 28 ([EDPB PDF](https://www.edpb.europa.eu/system/files_en?file=2023-10%2FEDPB_guidelines_202007_controllerprocessor_final_en.pdf), accessed 2026-08-24).

| Art. 28 element | Published DPA page | Status |
|-----------------|-------------------|--------|
| Subject matter, duration, nature, purpose | Summary sections present | **PARTIAL — DOCUMENT VERIFIED** |
| Data categories & subjects | Listed | **DOCUMENT VERIFIED** |
| Processor obligations (instructions, confidentiality, security, breach notice, delete/return) | Summarized | **PARTIAL** |
| Sub-processor authorization & flow | Points to subprocessors page | **PARTIAL** |
| Specific TOMs / security detail | Refers to Security Policy — not annex-level | **EXTERNAL LEGAL REVIEW REQUIRED** |
| Audit rights | Mentioned generically | **EXTERNAL LEGAL REVIEW REQUIRED** |
| Countersigned enterprise DPA | “Request via legal@” — no auto-generated signed PDF | **OPERATIONAL PROCESS** |

**P1 finding — P1-002-DPA-001:** Web DPA is a **summary**, not a standalone signed Art. 28 contract. Acceptable for SMB self-serve only if counsel confirms; enterprise deals need countersigned addendum — **EXTERNAL LEGAL REVIEW REQUIRED**.

---

## K. Sub-processors & international transfers

**Published list (`legal-content.ts` subprocessors):**

| Sub-processor | Stated purpose | Implementation note | Status |
|---------------|----------------|---------------------|--------|
| Supabase | DB, auth, storage | Used | **TECHNICALLY VERIFIED** |
| Vercel | Hosting | Used | **TECHNICALLY VERIFIED** |
| Mollie | Payments | Sole billing PSP | **TECHNICALLY VERIFIED** |
| Resend | Transactional email | **Production path is SMTP (STRATO)** per `.env.example` | **P2 DOCUMENT FIX** — list Resend as optional/alternate or add SMTP operator |
| OpenAI | Optional AI | Gated by env + workspace | **TECHNICALLY VERIFIED** |

Transfers: Privacy + DPA reference SCCs for extra-EEA processing — **DOCUMENT VERIFIED**. Specific SCC version / TIA documentation: **NOT VERIFIED**.

**P2 finding — P1-002-SUB-001:** Sub-processor page names Resend while production email is SMTP — creates procurement mismatch. **Remediation:** **DOCUMENT FIX** (operator/legal).

---

## L. Privacy, analytics & cookies

| Control | Policy claim | Implementation | Status |
|---------|--------------|----------------|--------|
| Analytics opt-in (public site) | Privacy + Cookies policies | `consent-gate.ts`, `cookie-preferences-modal.tsx`, localStorage consent | **TECHNICALLY VERIFIED** |
| Plausible / Clarity / PostHog | Analytics category | `analytics/providers.ts` — init gated | **TECHNICALLY VERIFIED** |
| GA4 / marketing | Marketing category, not default | Same | **TECHNICALLY VERIFIED** |
| Authenticated app logging | Separate from marketing cookies | Privacy § analytics — operational logging | **DOCUMENT VERIFIED** |
| Cookie banner | Footer reopen + modal | Components present | **CODE PRESENT** — banner runtime **NOT VERIFIED** |

**NOT VERIFIED:** Production env actually enables/disables specific provider IDs; PostHog/GA4 keys in Vercel.

**No “100% GDPR compliant” marketing claim found** — **TECHNICALLY VERIFIED** (grep / legal tone).

---

## M. Data subject rights, deletion & retention

| Capability | Status |
|------------|--------|
| GDPR request types (access, deletion, export, etc.) | Compliance center actions — `compliance/actions.ts` | **TECHNICALLY VERIFIED** |
| Workspace admin handling described | Privacy policy | **DOCUMENT VERIFIED** |
| Retention rules | DB-backed; **simulation only** — no auto-delete | `retention.ts` | **TECHNICALLY VERIFIED** |
| Post-termination data delete/return | Terms + DPA high-level | **DOCUMENT VERIFIED** — operational runbook **NOT VERIFIED** |

**P2 finding — P1-002-GDPR-001:** Retention automation disabled (v1 simulation) — document clearly; enterprise buyers may require roadmap — **OPERATIONAL PROCESS**.

---

## N. AI processing

| Element | Status |
|---------|--------|
| OpenAI optional sub-processor disclosed | **DOCUMENT VERIFIED** |
| Terms §7 — decision-support only, no guaranteed accuracy | **DOCUMENT VERIFIED** |
| Server-only OpenAI provider | `openai.ts` — no client import | **TECHNICALLY VERIFIED** |
| Customer enable/configure gating | Integration center / env | **CODE PRESENT** |
| DPIA / AI Act classification | Not in repo | **EXTERNAL LEGAL REVIEW REQUIRED** (if high-risk use cases marketed) |

---

## O. Email legal consistency

| Template | Legal elements present | Gap |
|----------|------------------------|-----|
| Purchase activated | Support contact, billing link | No imprint, VAT, terms link, company address |
| Subscription cancel / withdraw / plan change | Support contact, billing CTA | Same |
| Welcome | (separate template) | **NOT FULLY AUDITED** |

**P2 finding — P1-002-EMAIL-001:** Transactional emails are operational, not contract notices with full Impressum — common for SaaS but **EXTERNAL LEGAL REVIEW REQUIRED** for DE B2B expectations (§5 DDG electronic correspondence).

**Provider consistency:** Production SMTP (STRATO) vs subprocessors “Resend” — see §K.

---

## P. Fifteen financial invariants (legal/commercial lens)

Re-verified from source (see `docs/final-production-certification-audit-v1.md` §PHASE H). All **CODE PRESENT**. Legal relevance:

| # | Invariant | Legal/commercial note |
|---|-----------|----------------------|
| 1–4 | Entitlements/webhook authority | Supports “payment initiated ≠ final access” narrative in Terms |
| 5–6 | LIVE kill switch / TEST-only | Audit preserved `MOLLIE_LIVE_CHARGING_ENABLED=false` |
| 7 | FastSpring row protection | Prevents double-billing — consumer protection adjacent |
| 8 | Catalog-only charge amounts | Supports pricing page consistency |
| 9–10 | Cancel / upgrade integrity | Matches refund + Terms |
| 11–15 | Recovery, email idempotency, RLS, operator auth | Operational compliance enablers |

**Live financial flows:** **NOT VERIFIED** end-to-end in this audit.

---

## Q. Public surface scrub (MoR / legacy billing)

| Search target | Customer-facing `src/` (marketing, legal, pricing, auth) | Internal/diagnostics |
|---------------|----------------------------------------------------------|----------------------|
| “Merchant of Record” / “MoR” | **0 hits** | — |
| FastSpring (checkout/pricing) | Retired; test panel redirects to Mollie | Archive modules remain |
| Paddle / Stripe (active billing) | **0 customer checkout paths** | Diagnostics panels show legacy Stripe archive labels |
| Mollie as sole PSP | FAQ, legal, integrations catalog | **DOCUMENT VERIFIED** |

**P2 finding — P1-002-SCRUB-001:** Internal diagnostics still say “Stripe subscription rows” — not customer-facing; acceptable for operator tools.

**P2 finding — P1-002-SCRUB-002:** `active-billing.ts` header comment still mentions FastSpring sole provider (noted in v1 audit P2-001).

---

## R. Findings register

| ID | Sev | Title | Class | Status |
|----|-----|-------|-------|--------|
| P1-002-001 | **P1** | External legal counsel sign-off outstanding (MoR/tax/refund/B2B) | EXTERNAL LEGAL REVIEW | Open |
| P1-002-002 | **P1** | VAT model placeholder (20% flat); no VIES/reverse charge/OSS | EXTERNAL TAX REVIEW + ENGINEERING FIX | Open |
| P1-002-003 | **P1** | No structured B2B invoice / E-Rechnung issuance | EXTERNAL TAX REVIEW + ENGINEERING FIX + OPERATIONAL PROCESS | Open |
| P1-002-004 | **P1** | Signup lacks entrepreneur attestation + explicit Terms acceptance | EXTERNAL LEGAL REVIEW + ENGINEERING FIX | Open |
| P1-002-005 | **P1** | Web DPA is summary — enterprise needs signed Art. 28 | EXTERNAL LEGAL REVIEW + OPERATIONAL PROCESS | Open |
| P1-002-006 | **P2** | Sub-processors list Resend; production email is SMTP | DOCUMENT FIX | Open |
| P1-002-007 | **P2** | Transactional emails lack full Impressum/legal footer | EXTERNAL LEGAL REVIEW + DOCUMENT FIX | Open |
| P1-002-008 | **P2** | `invoice_url` points to Mollie checkout link — labeling risk | DOCUMENT FIX / ENGINEERING FIX | Open |
| P1-002-009 | **P2** | Internal Stripe/FastSpring diagnostic labels | DOCUMENT FIX (optional) | Open |
| P1-002-010 | **P3** | German 19% vs code 20% VAT placeholder | EXTERNAL TAX REVIEW | Open |

**P0:** None proven in this pass.

---

## S. External research log

| Topic | Tier | URL | Accessed |
|-------|------|-----|----------|
| Mollie tax responsibility | 1 | https://www.mollie.com/legal/user-agreement | 2026-08-24 |
| Mollie invoice VAT liability | 1 | https://www.mollie.com/legal/mollie-invoicing-terms | 2026-08-24 |
| Mollie not MoR for platforms | 1 | https://docs.mollie.com/docs/connect-platforms-balance-transfers | 2026-08-24 |
| Mollie bookkeeping / VAT | 1 | https://help.mollie.com/hc/en-gb/articles/360018425879 | 2026-08-24 |
| Mollie Invoicing product | 1 | https://docs.mollie.com/docs/invoicing | 2026-08-24 |
| German E-Rechnung BMF | 1 | https://www.bundesfinanzministerium.de/Content/DE/Downloads/BMF_Schreiben/Steuerarten/Umsatzsteuer/Umsatzsteuer-Anwendungserlass/2025-10-15-einfuehrung-obligatorische-e-rechnung.pdf | 2026-08-24 |
| German E-Rechnung FAQ (BStBK) | 1 | https://www.bstbk.de/downloads/bstbk/steuerrecht-und-rechnungslegung/fachinfos/BStBK_FAQ_E-Rechnung_final.pdf | 2026-08-24 |
| EU VAT reverse charge Art. 196 | 1/2 | Directive 2006/112/EC via EUR-Lex + professional implementation guides | 2026-08-24 |
| GDPR Art. 28 / DPA content | 1 | https://www.edpb.europa.eu/.../EDPB_guidelines_202007_controllerprocessor_final_en.pdf | 2026-08-24 |
| B2B entrepreneur checkbox DE | 2 | https://www.haendlerbund.de/de/news/aktuelles/wissenssnack/verbraucherausschluss-b2b-handel | 2026-08-24 |
| B2B automatic renewal | 2 | https://www.eversheds-sutherland.com/de/germany/insights/automatische-vertragsverlangerungen-in-b-2b-vertragen | 2026-08-24 |

**SOURCE CONFLICTS:** None between Tier-1 Mollie tax responsibility and EU VAT principles. **Internal conflict:** code VAT 20% vs DE statutory 19% — flagged for tax adviser.

---

## T. Operator decision & next steps

### Decision matrix

| Gate | Recommendation |
|------|----------------|
| Mollie TEST pilot (no LIVE charges) | **PROCEED** — legal pages adequate for pilot with explicit B2B positioning; monitor P1-002-004 UX gap |
| LIVE revenue / general availability billing | **HOLD** — close P1-002-001 through P1-002-005 first |
| `MOLLIE_LIVE_CHARGING_ENABLED` | **KEEP FALSE** until legal + tax sign-off recorded in release checklist |

### Recommended order (no automatic fixes applied in this audit)

1. **Engage German SaaS counsel** — MoR allocation, B2B signup/checkout, DPA, refund enforceability, Impressum completeness (P1-002-001, -004, -005, -007).
2. **Engage tax adviser (DE + EU VAT)** — rate model, VIES, reverse charge, OSS need, E-Rechnung timeline vs turnover (P1-002-002, -003, -010).
3. **Operator:** Confirm VAT ID active (BZSt/VIES); document in `enterprise-release-checklist.md`.
4. **Engineering backlog (post-counsel):** VAT/VIES checkout, invoice generation (Mollie Invoicing or native XRechnung/ZUGFeRD), signup terms/B2B checkbox, subprocessors SMTP alignment, email footers.
5. **Do not enable LIVE charging** until checklist items above are signed.

### Audit artifact

| Item | Value |
|------|-------|
| Files changed | `docs/p1-002-de-eu-legal-tax-certification.md` only |
| Commits | None (per audit instructions) |
| LIVE charging touched | **No** |

---

*End of P1-002 DE/EU Legal, Tax & Privacy Certification Audit*
