# DPIA Counsel Review — Art. 35 screening bridge

**Status:** `COUNSEL_REVIEW_REQUIRED`  
**Source:** [`dpia-screening.md`](./dpia-screening.md)  
**Rule:** Engineering does **not** decide the final legal answer.  
**Forbidden without legal approval:** labeling the program `DPIA_NOT_REQUIRED` as a closed legal conclusion.

---

## Engineering screening summary

From `dpia-screening.md` (internal artifact):

| Processing | Engineering preliminary code | Notes |
|------------|------------------------------|-------|
| Multi-tenant B2B SaaS ops data | Screening suggested “not currently indicated” **pending counsel** | RBAC/RLS; no special-category **core** product |
| Optional generative AI | `DPIA_RECOMMENDED` | Assistive; human review expected; optional enablement |
| Marketing newsletter + optional analytics | Screening suggested not currently indicated | Consent-gated; revisit if profiling expands |
| Billing / Mollie PSP | Screening suggested not currently indicated **subject to counsel** | Payment via PSP; statutory invoices |
| Error monitoring (Sentry) | Screening suggested not currently indicated | Scrubbed; optional |

**Aggregate engineering result in source:** `LEGAL_COUNSEL_CONFIRMATION_REQUIRED`, with **DPIA_RECOMMENDED** for generative AI until counsel confirms.

---

## Pack classification (for counsel handoff)

Overall engineering risk posture for counsel prioritisation:

### `ENGINEERING_SCREENING_MIXED`

Rationale:

- Baseline SaaS ops + billing + consent-gated marketing appear **lower** on the engineering screening checklist.  
- Optional generative AI (prompts may include personal/ops data; novel assistive tech) is flagged **higher attention** (`DPIA_RECOMMENDED`).  
- Therefore the pack does **not** assert a uniform `ENGINEERING_SCREENING_LOW_RISK` or `ENGINEERING_SCREENING_HIGHER_RISK` for the whole platform.

| Scope slice | Engineering label for counsel |
|-------------|-------------------------------|
| Core B2B SaaS workspace (no AI) | leaning `ENGINEERING_SCREENING_LOW_RISK` — **not** a legal “DPIA not required” |
| Generative AI features when enabled | `ENGINEERING_SCREENING_HIGHER_RISK` relative to core SaaS (still not a final Art. 35 decision) |
| Platform overall | `ENGINEERING_SCREENING_MIXED` |

---

## Screening questions (carry-forward)

1. Large-scale systematic monitoring of individuals?  
2. Special-category / highly sensitive data as core processing?  
3. Automated decisions producing legal/similarly significant effects (Art. 22 adjacency)?  
4. Innovative AI with unclear residual risk?  
5. Systematic processing of vulnerable persons?  
6. Unexpected dataset combination?  
7. Processing preventing exercise of rights / new tech at scale?

Engineering has **not** evidenced Art. 22 solely automated legal/significant decisions as a product purpose (no Art. 22 implementation markers found in `src/` search during pack prep). Counsel should still confirm borderline cases (credit-like scoring, employment, etc. if customers misuse features).

---

## Narrow counsel questions

1. For the **current** deployed AI scope (optional OpenAI-backed assistive drafting with human review UI), is a full Art. 35 DPIA **mandatory**, **recommended**, or **not required**?  
2. If AI remains disabled org-wide, does the baseline SaaS still need a DPIA?  
3. Does optional session analytics (Clarity) or GA4 change the answer if enabled?  
4. Who owns DPIA updates when a new OPTIONAL subprocessor is activated?

## Explicit non-claims

- This document is **not** a completed DPIA.  
- This document does **not** authorize marketing statements that “no DPIA is required.”  
- Revisit triggers: new AI modalities, special-category features, large-scale monitoring, Art. 22-like decisioning, material profiling expansion.
