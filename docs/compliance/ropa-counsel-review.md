# RoPA Counsel Review — Art. 30 GDPR worksheet

**Status:** `ROPA_GROUNDWORK_READY_FOR_REVIEW`  
**Do NOT label:** `COMPLETE`, `LEGAL_APPROVED`, or “formal Art. 30 record finished.”  
**Source inventory:** [`ropa-processing-inventory.md`](./ropa-processing-inventory.md)  
**Entity:** Auroranexis AI Solutions (Germany; sole proprietorship)

This worksheet structures engineering groundwork for counsel to convert into a formal record of processing activities (Art. 30). Indicative lawful bases below are **engineering labels only**.

---

## Controller vs processor ledgers

Maintain **two** ledgers (recommended by counsel practice; engineering suggests split):

1. **Controller ledger** — Auroranexis as Verantwortlicher (accounts, billing admin, security, own marketing).  
2. **Processor ledger** — Auroranexis as Auftragsverarbeiter for customer workspace content (per DPA).

---

## Structured Art. 30 worksheet

### ROPA-01 — Workspace account & authentication

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Name/contact of controller | Auroranexis AI Solutions — see `company-information.ts` / imprint |
| Joint controllers | None identified in engineering inventory |
| Purposes | Provide SaaS access |
| Categories of data subjects | Customer staff users |
| Categories of personal data | Account identifiers, auth metadata |
| Recipients | Supabase, Vercel (ACTIVE) |
| Transfers | See international-transfer-review — Supabase/Vercel as configured |
| Retention | Account life + security logs (intent) — enforcement often `SIMULATION_ONLY` for logs |
| TOMs | Security Policy / DPA Annex II |
| Role | **Controller** (platform accounts) |
| Lawful basis (indicative) | Art. 6(1)(b) contract |

### ROPA-02 — Client operations CRM (customer content)

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Deliver contracted workspace features |
| Categories of data subjects | Customer end-clients / their personnel (Controller’s subjects) |
| Categories of personal data | Client/contact/ops records |
| Recipients | Supabase; optional AI if enabled |
| Retention | Subscription + offboarding; simulation retention rules |
| Role | **Processor** under DPA |
| Lawful basis (indicative) | Controller’s basis; processor under Art. 28 instructions |

### ROPA-03 — Billing & invoicing

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Charge & account; statutory invoices / e-invoice archive |
| Categories of data subjects | Customer org billing contacts |
| Categories of personal data | Billing identity, invoices, tax fields |
| Recipients | Mollie (PSP), Supabase |
| Retention | Statutory accounting / e-invoice archive — **not** auto-deleted |
| Role | **Controller** (seller/billing) + PSP relationship for payment data |
| Lawful basis (indicative) | Art. 6(1)(b) + Art. 6(1)(c) |

### ROPA-04 — Transactional email

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Service / billing messages |
| Categories of data subjects | Users / leads as applicable |
| Categories of personal data | Email, message content |
| Recipients | SMTP/STRATO ACTIVE; Resend OPTIONAL; other ESPs CODE_SUPPORTED |
| Retention | Operational email logs per provider |
| Role | Mixed (service messages under contract; see Privacy) |
| Lawful basis (indicative) | Art. 6(1)(b) / (f) service |

### ROPA-05 — Marketing newsletter

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Product updates |
| Categories of data subjects | Prospects / subscribers |
| Categories of personal data | Email, consent evidence (`consent_records`) |
| Recipients | Sales lead store |
| Retention | Until withdrawal + suppression needs |
| Role | **Controller** |
| Lawful basis (indicative) | Art. 6(1)(a) consent — engineering: unchecked default / fail-closed (P1-03) |

### ROPA-06 — Contact / pilot intake

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Respond to inquiries / pilots |
| Categories of data subjects | Prospects |
| Categories of personal data | Name, email, company, message |
| Recipients | Sales lead store |
| Retention | Sales pipeline needs |
| Role | **Controller** |
| Lawful basis (indicative) | Art. 6(1)(b) steps / (f); marketing only if opted in (P1-12) |

### ROPA-07 — Optional analytics

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Product/marketing measurement |
| Categories of data subjects | Visitors / users |
| Categories of personal data | Pseudonymous events |
| Recipients | GA4, PostHog, Plausible, Clarity **if enabled** |
| Retention | Per provider + consent withdrawal |
| Role | **Controller** |
| Lawful basis (indicative) | Art. 6(1)(a) consent |

### ROPA-08 — Error monitoring

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Reliability / security |
| Categories of data subjects | Indirect (may include user identifiers in traces) |
| Categories of personal data | Stack traces, limited request context (scrubbed — engineering claim) |
| Recipients | Sentry if enabled |
| Retention | Provider retention |
| Role | **Controller** |
| Lawful basis (indicative) | Art. 6(1)(f) — counsel confirm vs consent for cookies/SDK |

### ROPA-09 — Optional generative AI

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Assist drafting/analysis |
| Categories of data subjects | Users; may include client data if submitted |
| Categories of personal data | Prompts, trusted ops context |
| Recipients | OpenAI OPTIONAL; Anthropic/Azure CODE_SUPPORTED |
| Retention | AI logs — simulation retention rules |
| Role | **Processor** when processing Controller content; platform config may also be controller ops |
| Lawful basis (indicative) | Contract + customer instructions; consent where required |

### ROPA-10 — Compliance / audit

| Art. 30 field | Groundwork content |
|---------------|-------------------|
| Purposes | Security & accountability |
| Categories of data subjects | Users |
| Categories of personal data | Audit events, GDPR request meta |
| Recipients | Supabase |
| Retention | Security/compliance retention intent |
| Role | **Controller** (accountability) / assist processor duties |
| Lawful basis (indicative) | Art. 6(1)(c) / (f) |

---

## Gaps for counsel conversion

- Exact retention periods per category (today largely simulation UI periods — see `retention-operator-review.md`)  
- Named DPO / representative if required  
- Supervisory authority identification for Art. 30(1)(a) contact block  
- Formal TOM cross-references per activity  
- Live OPTIONAL recipient enablement attestation  

**Status reminder:** `ROPA_GROUNDWORK_READY_FOR_REVIEW` — not a completed Art. 30 record.
