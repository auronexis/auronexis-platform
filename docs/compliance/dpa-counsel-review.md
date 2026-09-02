# DPA Counsel Review — Art. 28 GDPR / AVV

**STATUS:** `READY_FOR_EXTERNAL_LEGAL_REVIEW`  
**(Do not change this status in this pack. Do not claim lawyer approval.)**

| Field | Value |
|-------|--------|
| Public route | `/data-processing-agreement` (also marketing `/dpa`) |
| Source | `src/lib/company/dpa-document.ts` |
| Document version | `dpa-2026-08-29-v1` |
| Internal marker | `DPA_EXTERNAL_REVIEW_STATUS = READY_FOR_EXTERNAL_LEGAL_REVIEW` (not rendered on public UI) |
| Annex III source | `src/lib/company/subprocessors-inventory.ts` |
| Acceptance evidence kind | `organization_contract_acceptances.kind = dpa` (per module comments) |

Related: [`counsel-review-index.md`](./counsel-review-index.md), [`subprocessor-counsel-review.md`](./subprocessor-counsel-review.md), [`../billing/subprocessor-change-procedure.md`](../billing/subprocessor-change-procedure.md).

---

## Checklist A–N

For each item: **CURRENT TEXT EXISTS** | **ENGINEERING EVIDENCE** | **LEGAL REVIEW REQUIRED** | **OPEN QUESTION**.

### A — Parties / roles (controller vs processor)

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §2 Parties: Processor identity (legal name, owner, address, VAT, legal@); Controller = subscribing organization for workspace personal data; independent-controller carve-out points to Privacy Policy |
| ENGINEERING EVIDENCE | `buildDpaPageSections()` §2; `COMPANY_INFORMATION` / `COMPANY_CONTACT` |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Is the dual-role carve-out (processor for workspace content vs controller for accounts/billing/marketing) sufficiently clear for German AVV practice? |

### B — Subject matter and duration

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §3 Subject matter and duration |
| ENGINEERING EVIDENCE | Multi-tenant SaaS hosting/ops description; subscription + post-termination retention |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Is “any post-termination retention required by contract or law” adequately specific, or should durations be annexed? |

### C — Nature and purpose of processing

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §4 Nature and purpose |
| ENGINEERING EVIDENCE | Lists support, billing linkage, security/abuse prevention, optional AI when enabled |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Should optional AI be a separately instructed purpose with opt-in documentation requirements? |

### D — Types of personal data

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §5 Types of personal data |
| ENGINEERING EVIDENCE | Categories depend on Controller upload; aligns with Privacy categories |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Need explicit exclusion / handling notes for special-category data if Controllers upload it contrary to AUP? |

### E — Categories of data subjects

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §6 |
| ENGINEERING EVIDENCE | Staff, clients, portal users, other individuals Controller chooses to process |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Adequate for B2B MSP / agency use cases with end-client data? |

### F — Documented instructions

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §7 |
| ENGINEERING EVIDENCE | DPA + Terms + in-product config + written support/legal channels; infringement notice duty |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Are “in-product configuration” instructions sufficiently “documented” under Art. 28(3)(a)? |

### G — Controller obligations

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §8 |
| ENGINEERING EVIDENCE | Lawful basis warranty; notices; accuracy; access configuration |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Any additional German B2B warranties counsel wants (e.g. employee works-council / employee-data notices)? |

### H — Processor obligations (Art. 28(3) catalogue)

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §9 (a)–(h) mirrors Art. 28(3) themes |
| ENGINEERING EVIDENCE | Confidentiality, TOMs, subprocessors, DSAR assist, security/DPIA assist, delete/return, audit info |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Is assistance wording “reasonable for multi-tenant SaaS” acceptable, or too soft vs mandatory assist duties? |

### I — Confidentiality

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §10 |
| ENGINEERING EVIDENCE | Commitment / statutory confidentiality; survival clause |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Need explicit employee/contractor NDA evidence process for audits? |

### J — TOMs (Art. 32)

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §11 + Annex II |
| ENGINEERING EVIDENCE | TLS in transit; logical tenant isolation; RBAC; auth; need-to-know; audit logging; incident procedures; CVD; backups; Security Policy link; **no ISO/SOC claim** |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Is Annex II proportionate for sole-prop + cloud SaaS, or must TOMs be more granular (encryption-at-rest attribution, key management, subprocessors’ TOMs)? |

### K — Subprocessors (Art. 28(2)/(4))

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §12 + Annex III from live inventory |
| ENGINEERING EVIDENCE | General authorization; Art. 28(4) responsibility; advance notice + objection + terminate path; `docs/billing/subprocessor-change-procedure.md` |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Is “reasonable advance notice” via admin communication and/or public list update adequate vs fixed calendar days for enterprise DE customers? |

### L — International transfers

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §13 + Annex IV |
| ENGINEERING EVIDENCE | States SCCs / supplementary measures “where required”; details on request at legal@; **does not invent DC locations**; **no filed TIA pack in repo** |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | May Auroranexis keep “SCCs where required” without publishing module/TIA per provider, or must Annex IV be completed before counsel sign-off? See [`international-transfer-review.md`](./international-transfer-review.md). |

### M — Assistance (DSAR, security, DPIA) / audits / deletion / breaches

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §14 Assistance; §15 Audits; §16 Deletion/return; §17 Breaches |
| ENGINEERING EVIDENCE | DSAR playbooks; breach runbook; compliance GDPR request tracking (manual fulfillment); export helpers; statutory billing retention carve-out |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Deletion §16 vs simulation-only retention — is contractual delete/return credible without automated purge? (Operator-assisted process exists.) |

### N — Liability, hierarchy, governing law, contact, Annex I

| Column | Content |
|--------|---------|
| CURRENT TEXT EXISTS | Yes — §18–20; Annex I processing description |
| ENGINEERING EVIDENCE | Liability → Terms unless enterprise addendum; DPA prevails on DP processing terms for workspace data; governing law/venue follow Terms; contacts legal/support/security |
| LEGAL REVIEW REQUIRED | Yes |
| OPEN QUESTION | Confirm German law / venue clauses in Terms align with DPA §19 for sole proprietorship B2B SaaS. |

---

## Engineering completeness vs legal approval

| Aspect | Label |
|--------|-------|
| Draft text published | `ENGINEERING_COMPLETE` |
| Versioning / acceptance hook | `ENGINEERING_COMPLETE` |
| Annex III sync with inventory | `ENGINEERING_COMPLETE` (as of inventory `subprocessors-2026-09-02-v2`) |
| Counsel / notary / bar approval | **Not claimed** — remains `READY_FOR_EXTERNAL_LEGAL_REVIEW` |
| SCC/TIA annex completeness | `PARTIAL` / `COUNSEL_REVIEW_REQUIRED` |

## Items explicitly NOT approved by this document

- Enforceability of the public standard DPA without countersignature  
- Adequacy under German supervisory-authority expectations  
- Any statement that customers are “covered” or “certified” by signing/accepting the DPA  
