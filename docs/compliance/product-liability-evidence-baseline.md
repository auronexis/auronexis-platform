# Product Liability Evidence Baseline

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Instrument:** Directive (EU) 2024/2853  
**Source:** https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024L2853  
**Rule:** No liability conclusions. Focus on **preserving evidence**. Software (including SaaS supply) is expressly within the modern regime (Recital 13). Applies to products placed on the market / put into service **after 9 December 2026** (Art. 2).

---

## Evidence domains

| Domain | CURRENT STATE | PRESERVATION GAP | REQUIRED PRACTICE | Priority |
|--------|---------------|------------------|-------------------|----------|
| Release history | Git commits on GitHub; merge history | No immutable release archive outside git | Tag releases; retain build IDs / Vercel deployment IDs | HIGH |
| Versioning | `package.json` version `1.0.3`; APP_VERSION in product | No published changelog for security-relevant changes | Maintain changelog with security section | HIGH |
| Change logs | Phase docs / PR history | Fragmented; not customer-evidentiary | Central release notes store | MEDIUM |
| Incident records | `security_incidents` + ops docs | May not capture product-defect safety angles | Link security/product incidents to release versions | HIGH |
| Known-defect handling | Informal | No known-defect register | Track known defects, mitigations, customer communications | HIGH |
| Security patches | Deploy-as-SaaS | Patch evidence not catalogued | Security bulletin + commit/deploy linkage | HIGH |
| AI changes | AI modules + provider config | Model/provider/prompt changes not versioned as evidence pack | Log model, prompt version, feature flags per change | HIGH |
| Third-party dependency changes | `package-lock.json` | No SBOM/diff retention policy | Retain lockfile per release; later SBOM | HIGH |
| Customer-impacting changes | Release checklist docs | Incomplete linkage to customer notice | Mark breaking/security impact in releases | MEDIUM |
| Testing evidence | CI lint/typecheck/readiness/build/regression suites | CI logs retention depends on GitHub settings | Define CI log retention; archive critical runs | MEDIUM |
| Regression evidence | Enterprise regression scripts | Not mapped to defect closure | Keep failing/passing evidence for severe defects | MEDIUM |
| Deployment evidence | Vercel deployments; go-live docs | Need systematic archive of production deploy SHAs | Record production SHA per go-live | HIGH |
| Rollback evidence | `docs/rollback-plan.md` | Drill evidence not regularly archived | Record rollback drills | MEDIUM |

---

## Minimum evidence retention targets (engineering proposal — not legal advice)

| Artifact | Suggested retention | Notes |
|----------|---------------------|-------|
| Release git tags + lockfiles | ≥ 10 years or per counsel | Align with PLD claim periods — LEGAL REVIEW |
| Production deployment SHA log | ≥ 10 years or per counsel | Include date/time, environment |
| Security incident & patch records | ≥ 10 years or per counsel | Link CVE/CWE if any |
| AI model/provider change log | ≥ 10 years or per counsel | Include kill-switch events |
| CI artifacts for release builds | ≥ 3 years minimum interim | Confirm with counsel |

---

## Explicit non-goals for Part 1

- No determination that Auroranexis is defective or liable  
- No customer-facing “product liability compliant” claim  
- No new defect-tracking product feature in this phase  

---

## Controls linkage

- `PLD-EVID-001` in control register  
- Evidence IDs: `EVD-REL-001`, `EVD-REL-002`, `EVD-SUP-001`, `EVD-CI-001`, `EVD-AI-003`, `EVD-DR-001`
