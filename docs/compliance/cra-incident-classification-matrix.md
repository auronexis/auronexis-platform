# CRA Incident Classification Matrix (Internal)

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Companion:** `cra-reporting-runbook.md`  
**Rule:** Separate **INTERNAL SEVERITY** from **LEGAL REPORTABILITY**.  
A HIGH internal severity is not automatically CRA-reportable. A LOW internal severity is not automatically non-reportable.

Legal criteria for reportability (when CRA scope is confirmed) come from Regulation (EU) 2024/2847 Art. 14 (actively exploited vulnerability / severe incident). Do not invent numeric CRA thresholds beyond Art. 14(5).

---

## Internal severity scale

| INTERNAL SEVERITY | Operational guidance (non-legal) |
|-------------------|----------------------------------|
| CRITICAL | Immediate widespread compromise risk, active malicious use, or severe multi-tenant impact |
| HIGH | Significant confidentiality/integrity/availability impact under realistic conditions |
| MEDIUM | Limited impact, constrained conditions, or partial security degradation |
| LOW | Defense-in-depth gap or low practical impact |

---

## Classification worksheet columns

Use one row per security event (or update the row as facts change).

| Column | Description |
|--------|-------------|
| Classification ID | e.g. `EVT-YYYYMMDD-NNN` |
| Event type | vulnerability / security incident / researcher report / other |
| Actively exploited? | yes / no / unknown (requires reliable evidence for “yes”) |
| Security impact | narrative |
| Customer impact | none / limited / multi-tenant / unknown |
| Availability impact | none / degraded / outage / unknown |
| Confidentiality impact | none / limited / significant / unknown |
| Integrity impact | none / limited / significant / unknown |
| Affected product/version | product + version / deploy SHA |
| Evidence of exploitation | summary + evidence IDs |
| CRA reporting candidate? | REPORTING CANDIDATE / NOT CURRENTLY REPORTABLE / INSUFFICIENT EVIDENCE / LEGAL REVIEW REQUIRED |
| GDPR cross-check? | YES → `GDPR BREACH ASSESSMENT REQUIRED` / NO |
| Escalation level | L1 Security / L2 Legal+Security / L3 Executive |
| Required decision deadline | UTC deadline for next Art. 14 stage **if** reporting applies; else N/A |

---

## Example patterns (illustrative — not filings)

| Classification ID | Event type | Actively exploited? | INTERNAL SEVERITY | CRA reporting candidate? | Notes |
|-------------------|------------|---------------------|-------------------|--------------------------|-------|
| EVT-PATTERN-01 | Auth vulnerability with confirmed malicious use | yes | CRITICAL | LEGAL REVIEW REQUIRED until CRA scope confirmed; then likely REPORTING CANDIDATE | Start 24h clock only when scope+criteria confirmed |
| EVT-PATTERN-02 | Multi-tenant integrity/availability incident | unknown | CRITICAL | LEGAL REVIEW REQUIRED vs Art. 14(5) severe incident | Assess malicious code / CIA impact |
| EVT-PATTERN-03 | CVD report, no exploitation evidence | no | HIGH or MEDIUM | NOT CURRENTLY REPORTABLE for Art. 14 active exploitation | Continue Part 2 CVD path |
| EVT-PATTERN-04 | Misconfiguration, no product security impact | no | LOW | NOT CURRENTLY REPORTABLE | Preserve evidence if disputed |

---

## Decision reminder

1. Assign INTERNAL SEVERITY for operational response.  
2. Run actively exploited / severe incident trees in the CRA reporting runbook.  
3. Apply CRA scope gate (Part 1: POSSIBLE / LEGAL REVIEW REQUIRED).  
4. Only then set CRA reporting candidate state and Art. 14 clocks.
