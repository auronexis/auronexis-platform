# Data Act / Portability Baseline

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Instrument:** Regulation (EU) 2023/2854 (Data Act)  
**Source status:** REQUIRES LEGAL SOURCE VERIFICATION for precise EUR-Lex article mapping and chapter applicability dates  
**Rule:** Do **not** assume all SaaS is covered identically to IoT connected-product chapters.

---

## Applicability posture

| Question | Baseline answer |
|----------|-----------------|
| Is Auroranexis a connected product manufacturer (IoT)? | **UNLIKELY** on repository evidence (browser SaaS, no device firmware) |
| Do cloud switching / data processing service chapters possibly apply? | **POSSIBLE — LEGAL REVIEW REQUIRED** |
| GDPR portability already applies? | **CONFIRMED** for personal data (Art. 20) — parallel but distinct from Data Act |

---

## Data categories (product evidence)

| Category | Owner perspective | Notes |
|----------|-------------------|-------|
| Account / membership | Platform + user | Emails, roles, org membership |
| Customer-entered operational data | Customer organization | Clients, risks, incidents, reports, knowledge, automation configs |
| Audit / security logs | Platform controller interests + customer visibility | Compliance center exports |
| Billing identifiers | Platform seller + Mollie PSP (**HISTORICAL:** FastSpring MoR era) | Payment details primarily at Mollie PSP; Auroranexis remains contractual seller |
| AI inputs/outputs | Customer + platform processing | When AI enabled |

---

## Current technical capabilities

| Capability | State | Evidence | Gap |
|------------|-------|----------|-----|
| Audit export (CSV/JSON/evidence) | IMPLEMENTED (org admin) | `src/lib/compliance/export.ts`, audit exporter | Not full tenant business-data export |
| GDPR request registry | PARTIAL | `gdpr_requests` workflow | Fulfillment automation incomplete |
| Public/API access | PARTIAL | `/api/v1/**` exists | Coverage vs full dataset unmapped |
| UI data access | IMPLEMENTED | Authenticated CRUD surfaces | Not a switching package |
| Subprocessor-held data | DOCUMENTED | Subprocessors page | Export across subprocessors not automated |

---

## Switching / lock-in considerations

| Factor | Observation | Risk |
|--------|-------------|------|
| Proprietary data model | Multi-tenant Postgres schema | Export needs schema documentation |
| Automation/connectors | Integration secrets & workflows | Switching friction |
| AI context | Prompt/history not a portable standard | Clarify non-portability where appropriate |
| Billing PSP / seller | Mollie processes payments; Auroranexis sells access (**HISTORICAL:** FastSpring MoR rails) | Account closure ≠ data export |
| Contractual terms | Terms/DPA in legal content | Counsel to review unfair switching terms under Data Act if applicable |

---

## Legal-review questions (for counsel)

1. Which Data Act chapters apply to a German B2B SaaS without IoT hardware?  
2. Are organization workspace exports in scope of switching obligations?  
3. What formats and timelines would be required if in scope?  
4. How do Data Act duties interact with GDPR Art. 20 and confidentiality of other tenants?  
5. What contractual terms must change (notice periods, charges for switching, data retrieval after termination)?

---

## Required actions (later parts — not Part 1 implementation)

| Action | Priority |
|--------|----------|
| Counsel applicability memo | HIGH |
| Define tenant export scope (entities + formats) | HIGH |
| Document API coverage matrix vs export scope | MEDIUM |
| Termination data retrieval procedure | MEDIUM |

Control link: `DATA-PORT-001`
