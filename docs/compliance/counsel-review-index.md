# Counsel Review Index — Auroranexis

**Pack status:** `READY_FOR_EXTERNAL_LEGAL_REVIEW`  
**Audience:** German / EU privacy & IT counsel; operator compliance sign-off  
**Baseline SHA:** `1fe7a59085060fa67d679bc70f702ef0106a8de7` (main = origin/main at pack preparation)  
**Production deployment reference (operator):** `dpl_6PR2b15pANakArv3vHXZjCkd8gpX`  
**Document date:** 2026-09-02  

**Hard rules for this pack**

- Engineering inventory and operator process preparation only — **not** a legal opinion, certification, or compliance claim upgrade.
- Forbidden labels unless proven: `GDPR_CERTIFIED`, `AI_ACT_CERTIFIED`, `FULLY_COMPLIANT`, `LEGAL_APPROVED`, `COUNSEL_APPROVED`.
- Link existing sources; do not duplicate full legal page text here.
- Public DPA marker remains `READY_FOR_EXTERNAL_LEGAL_REVIEW` (internal; not rendered on customer UI).

---

## 1. Company / product

| Fact | Evidence |
|------|----------|
| Legal name | Auroranexis AI Solutions — `src/lib/company/company-information.ts` |
| Form | German sole proprietorship (`Einzelunternehmen`) |
| Owner | István-Tamás Schneller |
| Seat | Im Malerwinkel 4, 71566 Althütte, Germany |
| VAT | DE449657077 |
| Product | Auroranexis — B2B SaaS (client intelligence, risks, incidents, reports, executive insights) |
| Contacts | `legal@`, `privacy@`, `security@`, `support@` — `src/lib/company/company-contact.ts` |
| Public site | https://www.auroranexis.com |

## 2. B2B framing

Services are offered to business customers (entrepreneurs within § 14 BGB) per Privacy / Terms copy in `src/lib/company/legal-content.ts`. Consumer mass-market framing is **not** asserted.

**Counsel question:** Confirm B2B / Unternehmer framing remains adequate for standard ToS, DPA, and marketing surfaces.

## 3. Controller / processor model (engineering view)

| Role | Typical datasets | Primary docs |
|------|------------------|--------------|
| **Processor** | Customer-uploaded workspace content (clients, contacts, ops records, portal users) | DPA `/data-processing-agreement` — `src/lib/company/dpa-document.ts` |
| **Independent controller** | Platform accounts, billing identity, security logs, own marketing where consent applies | Privacy `/privacy` — `legal-content.ts` |
| **PSP (transparency)** | Payment transaction data via Mollie | Subprocessors inventory; Privacy billing sections |

Customers typically remain controllers of their end-client data; Auroranexis processes on documented instructions under the DPA.

## 4. Architecture overview (technical)

```
Browser (Next.js App Router)
  → Vercel hosting / edge
  → Supabase (Auth, Postgres + RLS, storage)
  → Mollie (PSP billing webhooks / checkout)
  → SMTP/STRATO (primary transactional email)
  → Optional: OpenAI, Sentry, consent-gated analytics
```

- Multi-tenant organizations, RBAC (`src/lib/rbac/**`), Supabase RLS.
- Business logic in `src/lib/**`; thin API / Server Actions.
- Compliance platform tables: `docs/compliance.md`, migration `supabase/migrations/20250624130000_audit_compliance_platform.sql`.

## 5. Hosting / DB / payment / AI (status)

| Layer | Provider | Activation (inventory) | Notes |
|-------|----------|------------------------|-------|
| Hosting | Vercel | ACTIVE | As configured for production deploy |
| DB / Auth / storage | Supabase | ACTIVE | EU-capable regions as configured — do not invent DCs |
| Payments | Mollie | ACTIVE | PSP only; **not** Merchant of Record |
| Email | SMTP / STRATO | ACTIVE | Primary transactional path |
| Email alternatives | Resend OPTIONAL; Postmark/Mailgun/SES CODE_SUPPORTED | See inventory |
| Generative AI | OpenAI OPTIONAL_CONFIGURABLE | Anthropic / Azure OpenAI CODE_SUPPORTED_NOT_ACTIVE |
| Monitoring | Sentry OPTIONAL_CONFIGURABLE | Scrubbing claimed in engineering remediations |
| Analytics | GA4 / PostHog / Plausible / Clarity OPTIONAL | Consent-gated |

Canonical inventory: `src/lib/company/subprocessors-inventory.ts` (`subprocessors-2026-09-02-v2`).

## 6. Technical compliance status (engineering labels only)

| Area | Status | Pointer |
|------|--------|---------|
| DPA Art. 28 draft | `READY_FOR_EXTERNAL_LEGAL_REVIEW` | `dpa-counsel-review.md`, `dpa-document.ts` |
| Subprocessor inventory sync | `ENGINEERING_COMPLETE` / `COUNSEL_REVIEW_REQUIRED` | `subprocessor-counsel-review.md` |
| International transfers | `PARTIAL` — Annex IV wording exists; **no fabricated SCC/TIA pack** | `international-transfer-review.md` |
| RoPA Art. 30 | `ROPA_GROUNDWORK_READY_FOR_REVIEW` | `ropa-counsel-review.md` |
| DPIA | Screening only — final decision for counsel | `dpia-counsel-review.md` |
| AI Act transparency / literacy | Engineering P1 closed/mitigated; counsel confirm | `ai-act-counsel-review.md`, `ai-literacy-counsel-review.md` |
| Breach / DSAR ops | Runbooks + tabletop worksheets ready, **not executed** | `operator-*-tabletop.md` |
| Retention | Simulation-only auto-delete | `retention-operator-review.md`, `docs/retention.md` |
| Public claims | Inventory for counsel | `legal-claims-register.md` |
| GDPR+AI P1 remediation | Engineering P1 FIXED/MITIGATED; P1-11 counsel | `gdpr-ai-act-p1-remediation-report.md` |

**Production note (operator baseline):** AI literacy route reported HTTP 200 in production; engineering P1 closed/mitigated; no proven P0 at pack preparation.

## 7. Known legal questions (summary)

Full prioritized list: [`questions-for-legal-counsel.md`](./questions-for-legal-counsel.md) (max 25). Themes:

1. Adequacy of Art. 28 DPA / AVV for German B2B SaaS  
2. SCC / transfer tool adequacy per ACTIVE and OPTIONAL providers  
3. Whether generative AI scope requires Art. 35 DPIA  
4. Formal Art. 30 RoPA conversion from groundwork  
5. Art. 50 disclosure sufficiency and Art. 4 literacy scope  
6. Mollie PSP vs controller/processor characterisation  
7. Cookie / Sentry / analytics consent under TTDSG–TDDDG  
8. Retention honesty vs deletion obligations  
9. Breach notification thresholds (controller vs processor paths)  
10. Marketing newsletter / contact consent separation  

## 8. Documents for counsel review (this pack)

| Document | Purpose |
|----------|---------|
| [counsel-review-index.md](./counsel-review-index.md) | This master entry |
| [dpa-counsel-review.md](./dpa-counsel-review.md) | Art. 28 checklist A–N |
| [international-transfer-review.md](./international-transfer-review.md) | Transfer inventory |
| [ropa-counsel-review.md](./ropa-counsel-review.md) | Art. 30 worksheet |
| [dpia-counsel-review.md](./dpia-counsel-review.md) | DPIA screening bridge |
| [ai-act-counsel-review.md](./ai-act-counsel-review.md) | AI feature matrix + Art. 50 questions |
| [ai-literacy-counsel-review.md](./ai-literacy-counsel-review.md) | Art. 4 literacy evidence |
| [subprocessor-counsel-review.md](./subprocessor-counsel-review.md) | ACTIVE / OPTIONAL / CODE-SUPPORTED |
| [operator-breach-tabletop.md](./operator-breach-tabletop.md) | Breach tabletop (not executed) |
| [operator-dsar-tabletop.md](./operator-dsar-tabletop.md) | DSAR tabletop (not executed) |
| [retention-operator-review.md](./retention-operator-review.md) | Retention behaviour map |
| [legal-claims-register.md](./legal-claims-register.md) | Public claims inventory |
| [operator-compliance-checklist.md](./operator-compliance-checklist.md) | Sole-prop cadence |
| [questions-for-legal-counsel.md](./questions-for-legal-counsel.md) | ≤25 counsel questions |
| [compliance-evidence-map.md](./compliance-evidence-map.md) | Requirement → evidence map |

## 9. Related existing docs (do not duplicate)

- Program baseline: [`README.md`](./README.md), [`eu-legal-applicability-matrix.md`](./eu-legal-applicability-matrix.md)  
- RoPA / DPIA groundwork: [`ropa-processing-inventory.md`](./ropa-processing-inventory.md), [`dpia-screening.md`](./dpia-screening.md)  
- AI Act baseline: [`ai-act-gap-baseline.md`](./ai-act-gap-baseline.md)  
- Ops: [`personal-data-breach-runbook.md`](./personal-data-breach-runbook.md), [`dsar-operator-playbooks.md`](./dsar-operator-playbooks.md)  
- Retention: [`../retention.md`](../retention.md)  
- Subprocessor change procedure: [`../billing/subprocessor-change-procedure.md`](../billing/subprocessor-change-procedure.md)  
- P1 remediation: [`gdpr-ai-act-p1-remediation-report.md`](./gdpr-ai-act-p1-remediation-report.md)  
- Evidence index (may contain stale FastSpring rows — treat as historical until refreshed): [`compliance-evidence-index.md`](./compliance-evidence-index.md)

## 10. Items NOT legally approved

The following are **engineering-complete or draft** and remain **not** counsel-approved unless counsel issues a separate written approval:

- Public DPA text (`DPA_DOCUMENT_VERSION` = `dpa-2026-08-29-v1`)  
- Subprocessor list / Annex III  
- Annex IV international-transfer wording (SCC references without filed TIA pack)  
- Privacy, Terms, Cookies, Security Policy marketing/legal copy  
- DPIA “not required” conclusions  
- Formal Art. 30 RoPA  
- AI Act risk classification / Art. 50 legal sufficiency  
- Any “GDPR compliant” / certification marketing  
- Tabletop drills (worksheets exist; execution records empty)

## 11. Contradictions / stale docs noted (documentation only)

| Issue | Location | Counsel/operator note |
|-------|----------|----------------------|
| FastSpring still named as active MoR | `docs/compliance/README.md` product context; `compliance-evidence-index.md` EVD-BILL-001 | Runtime billing is Mollie PSP — treat FastSpring mentions as **stale documentation** |
| Older P1-002 tax packs may list older email/subprocessor state | `docs/p1-002-*.md` | Prefer `subprocessors-inventory.ts` as canonical |
| Evidence index “security.txt missing” | `compliance-evidence-index.md` | Route exists: `src/app/.well-known/security.txt/route.ts` — index may be outdated |

No public copy was changed in this pack.
