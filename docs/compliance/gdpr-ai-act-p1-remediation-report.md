# GDPR + EU AI Act 2026 — P1 remediation re-audit

**Date:** 2026-09-02  
**Baseline SHA:** `d899c1eea4892d1a176078d7b2dace0decb66032`  
**Scope:** Controlled local remediation only — no push, no deploy  
**DPA status preserved:** `READY_FOR_EXTERNAL_LEGAL_REVIEW` (not lawyer-approved)

## P1 findings

| ID | Topic | Status | Notes |
|----|-------|--------|-------|
| P1-01 | AI Act Art.50 disclosure | FIXED | Shared `AiDisclosure`; wired on generative surfaces |
| P1-02 | Art.4 AI literacy | FIXED | `/docs/ai-literacy` + Help link; no training certification claims |
| P1-03 | Marketing consent (newsletter) | FIXED | Unchecked default, fail-closed, consent evidence |
| P1-04 | Public claim accuracy | FIXED | Encryption/GDPR wording aligned with Security Policy |
| P1-05 | Breach response runbook | FIXED | Practical runbook; notification not always required |
| P1-06 | DPA / subprocessors sync | MITIGATED | Inventory ACTIVE vs OPTIONAL vs CODE-SUPPORTED; DPA still counsel review |
| P1-07 | Retention honesty | FIXED | Simulation-only kept; Privacy claims corrected |
| P1-08 | DSAR operationalization | FIXED | Operator playbooks; no one-click wipe |
| P1-09 | Service role hardening | FIXED | `import "server-only"` on admin client |
| P1-10 | Consent hardening (analytics/Sentry) | FIXED | Withdraw teardown; GA4 MP fail-closed; Sentry scrub |
| P1-11 | DPIA / RoPA preparation | REQUIRES_COUNSEL | Screening + RoPA groundwork only |
| P1-12 | Contact/pilot marketing separation | FIXED | Service vs optional marketing |

Statuses never convert `REQUIRES_COUNSEL` into PASS.
