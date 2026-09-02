# AI Literacy Counsel Review — Art. 4 EU AI Act

**Status:** `ENGINEERING_COMPLETE` (public literacy page) / `COUNSEL_REVIEW_REQUIRED` (legal sufficiency)  
**Rule:** No training-completion, certification, or “AI Act compliant staff” claims.

---

## What exists

| Element | Evidence |
|---------|----------|
| Public docs page | `/docs/ai-literacy` — `AI_LITERACY_DOC` in `src/lib/docs/pages/extras.ts` |
| Registry / SEO allowlist | `src/lib/docs/registry.ts`; `public-dynamic-slug-allowlist.ts` includes `ai-literacy` |
| Help / marketing links | Help-related docs links; marketing content points to AI literacy |
| Explicit non-claims | Callouts: not a training certificate, compliance badge, or legal opinion; orgs remain responsible for own literacy measures |
| P1 remediation | P1-02 FIXED in `gdpr-ai-act-p1-remediation-report.md` |
| Production baseline (operator) | AI literacy route reported HTTP 200 |

## Targets (as written)

- Operators and workspace users  
- Explains generative vs deterministic vs predictive  
- Safe use, hallucination risk, human review, personal data minimization in prompts  
- Points to Privacy, DPA, subprocessors, security/compliance docs  

**Not claimed:** mandatory employee training curriculum, attendance records, exams, or certificates.

## Topics covered (engineering)

1. Overview of three assistance classes  
2. Core concepts (generative features list, deterministic, predictive, hallucination, human review, PD in prompts, unsafe reliance, security/subprocessors)  
3. Best practices (check disclosure, prefer verified records, no secrets in prompts, human accept before customer-facing save, escalate incidents)  
4. Troubleshooting (plan/entitlement, low confidence, missing labels → report; do not claim compliance from marketing)

## Public availability

- Indexable public docs surface under `/docs/ai-literacy` (public docs program; SEO allowlisted).  
- Authenticated product surfaces use `AiDisclosure` separately (Art. 50 engineering control) — see `ai-act-counsel-review.md`.

## Staff / customer relevance

| Audience | Relevance (engineering view) |
|----------|------------------------------|
| Auroranexis operator (sole prop / small team) | Proportionate literacy artifact; does **not** replace counsel-advised staff measures |
| Customer workspace users | Self-serve guidance for safe use of optional AI |
| Customer compliance officers | Reference material — not their Art. 4 program |

## Narrow counsel questions

1. Does a public `/docs/ai-literacy` page plus in-product disclosure labels meet **Art. 4** expectations for a German sole-prop B2B SaaS provider of optional generative features?  
2. Must Auroranexis maintain **internal** training records for the owner/contractors beyond the public page?  
3. What literacy duties, if any, must be contractually pushed to **customer deployers** of outputs?  
4. Is any additional language required to avoid implying customer Art. 4 compliance by linking the page?

## Explicit non-claims

- No assertion that Art. 4 obligations are fully discharged.  
- No assertion of certified AI literacy training.  
- No assertion that customers become AI Act compliant by reading the page.
