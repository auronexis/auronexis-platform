# Auroranexis EU Compliance Program — Part 1 Baseline

**Program phase:** Part 1 of 12 — Compliance applicability, legal inventory & evidence baseline  
**Document status:** BASELINE (engineering inventory; not a legal opinion; not a compliance certification)  
**Version:** 1.0.0  
**Baseline date:** 2026-08-10  
**Entity:** Auroranexis AI Solutions (Germany; sole proprietorship)  
**Product:** Auroranexis B2B SaaS  

## Hard rules for this baseline

- No claim that Auroranexis is “compliant,” “certified,” or “CE-marked” under any framework.
- No badges or customer-facing compliance marketing from this phase.
- No invented legal citations. Unverified article references use `ARTICLE TO VERIFY` or `REQUIRES LEGAL SOURCE VERIFICATION`.
- No speculative product implementation in Part 1 (SBOM tooling, new reporting UIs, new legal pages, etc.).
- Classifications use: `CONFIRMED` / `LIKELY` / `POSSIBLE` / `UNLIKELY` / `NOT APPLICABLE` / `LEGAL REVIEW REQUIRED`.

## Canonical documents (Part 1)

| Document | Purpose |
|----------|---------|
| [eu-legal-applicability-matrix.md](./eu-legal-applicability-matrix.md) | Framework applicability inventory |
| [eu-compliance-control-register.md](./eu-compliance-control-register.md) | Control register with gaps and owners |
| [eu-compliance-timeline.md](./eu-compliance-timeline.md) | Chronological obligations and prep deadlines |
| [compliance-evidence-index.md](./compliance-evidence-index.md) | Traceable repository/system evidence |
| [cra-gap-analysis.md](./cra-gap-analysis.md) | CRA-focused gap analysis |
| [ai-act-gap-baseline.md](./ai-act-gap-baseline.md) | AI feature inventory and AI Act baseline |
| [product-liability-evidence-baseline.md](./product-liability-evidence-baseline.md) | PLD evidence-preservation baseline |
| [data-act-portability-baseline.md](./data-act-portability-baseline.md) | Data Act / switching / export baseline |
| [nis2-dora-supplier-readiness.md](./nis2-dora-supplier-readiness.md) | Supplier readiness for regulated customers |
| [accessibility-baseline.md](./accessibility-baseline.md) | EAA / WCAG evidence baseline |
| [compliance-risk-register.md](./compliance-risk-register.md) | Prioritized compliance risks |
| [vulnerability-disclosure-runbook.md](./vulnerability-disclosure-runbook.md) | Internal CVD intake/triage runbook (Part 2) |
| [cra-reporting-runbook.md](./cra-reporting-runbook.md) | Internal CRA Art. 14 reporting readiness (Part 3) |
| [cra-incident-classification-matrix.md](./cra-incident-classification-matrix.md) | Internal severity vs legal reportability matrix |
| [cra-reporting-role-matrix.md](./cra-reporting-role-matrix.md) | Role / escalation matrix for CRA reporting |
| [security-incident-evidence-checklist.md](./security-incident-evidence-checklist.md) | Evidence preservation checklist |
| [cra-reporting-tabletop.md](./cra-reporting-tabletop.md) | Three-scenario CRA reporting tabletop |
| [personal-data-breach-runbook.md](./personal-data-breach-runbook.md) | GDPR personal-data-breach operator runbook |
| [dsar-operator-playbooks.md](./dsar-operator-playbooks.md) | DSAR fulfillment playbooks (operator-assisted) |
| [dpia-screening.md](./dpia-screening.md) | DPIA screening preparation |
| [ropa-processing-inventory.md](./ropa-processing-inventory.md) | Art. 30 RoPA groundwork inventory |
| [gdpr-ai-act-p1-remediation-report.md](./gdpr-ai-act-p1-remediation-report.md) | P1 GDPR + AI Act remediation re-audit |

## Authoritative sources used in Part 1

| Instrument | Source |
|------------|--------|
| Cyber Resilience Act | Regulation (EU) 2024/2847 — [EUR-Lex CELEX 32024R2847](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847) |
| AI Act | Regulation (EU) 2024/1689 — [EUR-Lex CELEX 32024R1689](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689) |
| Product Liability Directive | Directive (EU) 2024/2853 — [EUR-Lex CELEX 32024L2853](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L2853) |
| GDPR | Regulation (EU) 2016/679 — [EUR-Lex CELEX 32016R0679](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679) |
| Data Act | Regulation (EU) 2023/2854 — link verification noted in matrix where article mapping incomplete |
| NIS2 | Directive (EU) 2022/2555 — link verification noted in matrix where article mapping incomplete |
| EAA | Directive (EU) 2019/882 — link verification noted in matrix where article mapping incomplete |
| DSA | Regulation (EU) 2022/2065 — applicability conditional |
| DORA | Regulation (EU) 2022/2554 — primarily customer/sector dependency |

German transposition / TTDSG–TDDDG cookie obligations: see applicability matrix rows marked `REQUIRES LEGAL SOURCE VERIFICATION` for official German portals.

## Product context (evidence-based)

Confirmed from repository/legal content:

- Germany-based B2B SaaS (`src/lib/company/company-information.ts`)
- Multi-tenant organizations, RBAC, Supabase RLS
- Browser-accessed cloud software (Next.js / Vercel)
- Billing via Mollie as PSP only (Auroranexis remains the seller; **not** Merchant of Record). FastSpring / Paddle / Stripe are **HISTORICAL** archive only
- Optional AI features via OpenAI when enabled
- Public legal pages: privacy, terms, security policy, subprocessors, DPA, refund policy, cookies, imprint

Not assumed unless later proven:

- Medical device use, critical infrastructure operator status, financial-entity status, consumer mass-market app store distribution, hardware products

## Next phase

Part 2 recommendation is recorded in the program final report for this sprint and will be driven by the **2026 CRA Article 14 reporting readiness** gap and GDPR/controller documentation completeness.
