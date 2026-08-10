# CRA Reporting Tabletop Exercise (Internal)

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Purpose:** Validate that operators can execute Part 3 readiness without live filings.  
**Scenarios:** exactly **three** (hypothetical — no real customer data).

**References:** `cra-reporting-runbook.md`, `cra-incident-classification-matrix.md`, `cra-reporting-role-matrix.md`, `security-incident-evidence-checklist.md`

Do **not** submit anything to ENISA/SRP during this exercise.

---

## Acceptance criteria

The tabletop succeeds only if the operator can answer:

1. Who owns the incident?  
2. What is the awareness timestamp?  
3. Is CRA scope confirmed?  
4. Is this an actively exploited vulnerability?  
5. Is this a severe incident?  
6. Does the 24h clock apply?  
7. What must happen before 72h?  
8. What evidence is preserved?  
9. Does GDPR need separate assessment?  
10. Who is authorized to submit?  
11. What is the final-report timeline?

---

## SCENARIO 1 — Actively exploited authentication vulnerability

**Inject:** Monitoring and support signals indicate unauthorized access attempts succeeding against a subset of workspaces due to a flaw in Auroranexis authentication session handling. Reliable logs show a malicious actor used the flaw. Affected deploy SHA is known. CRA scope for Auroranexis remains **LEGAL REVIEW REQUIRED** per Part 1.

### Operator worksheet

| Question | Operator answer (fill during drill) |
|----------|-------------------------------------|
| Awareness timestamp (UTC) | |
| INTERNAL SEVERITY | |
| Active exploitation? | |
| CRA scope confirmed? | |
| Reportability candidate state | |
| 24h deadline (if clocks apply) | |
| 72h deadline (if clocks apply) | |
| GDPR cross-check | |
| Customer communication required? | |
| Evidence required | |
| Final-report path | Art. 14(2)(c): ≤14 days after corrective/mitigating measure available **if** reporting applies |

**Expected teaching points (facilitator):**

- Reliable exploitation evidence ≠ automatic filing while CRA scope is unconfirmed → typically `LEGAL REVIEW REQUIRED` + containment.  
- If/when scope confirmed: 24h early warning + 72h vulnerability notification clocks from awareness.  
- Final report path is **14 days after mitigation available**, not one month.  
- GDPR assessment likely required if account data exposed.

---

## SCENARIO 2 — Major multi-tenant integrity/availability incident

**Inject:** A security incident in production corrupts operational integrity for multiple tenants and causes extended availability degradation of security-relevant functions. Root cause may involve malicious code execution in the application environment. No authenticated researcher disclosure is involved.

### Operator worksheet

| Question | Operator answer (fill during drill) |
|----------|-------------------------------------|
| Awareness timestamp (UTC) | |
| INTERNAL SEVERITY | |
| Active exploitation? | |
| Severe incident under Art. 14(5)? | |
| CRA scope confirmed? | |
| Reportability candidate state | |
| 24h deadline (if clocks apply) | |
| 72h deadline (if clocks apply) | |
| GDPR cross-check | |
| Customer communication required? | |
| Evidence required | |
| Final-report path | Art. 14(4)(c): within **one month after** the 72h incident notification **if** reporting applies |

**Expected teaching points:**

- Use severe-incident tree (Art. 14(5)), distinct from actively exploited vulnerability.  
- Final-report deadline differs from Scenario 1.  
- Customer notification track is separate from SRP filing.  
- Preserve deploy/rollback/CI evidence.

---

## SCENARIO 3 — High-severity CVD report, no exploitation evidence

**Inject:** A researcher emails `security@auroranexis.com` with a high-impact IDOR proof-of-concept. Reproduction succeeds in a controlled test. There is **no** reliable evidence of malicious exploitation in production. Part 2 CVD process applies.

### Operator worksheet

| Question | Operator answer (fill during drill) |
|----------|-------------------------------------|
| Awareness timestamp (UTC) | |
| INTERNAL SEVERITY | |
| Active exploitation? | |
| CRA scope confirmed? | |
| Reportability candidate state | |
| 24h deadline (if clocks apply) | |
| 72h deadline (if clocks apply) | |
| GDPR cross-check | |
| Customer communication required? | |
| Evidence required | |
| Final-report path | N/A for Art. 14 unless exploitation/severe criteria later met |

**Expected teaching points:**

- High INTERNAL SEVERITY can coexist with `NOT CURRENTLY REPORTABLE` for Art. 14 active exploitation.  
- Continue CVD acknowledgment/triage targets from Part 2.  
- Re-open CRA assessment if exploitation evidence appears later (new awareness facts).  
- Do not invent exploitation to “be safe.”

---

## Drill record

| Field | Value |
|-------|-------|
| Drill date (UTC) | |
| Facilitator role | |
| Participants (roles) | |
| Scenarios completed (must be 1–3) | |
| Acceptance criteria met? | YES / NO |
| Gaps found | |
| Follow-up actions | |
