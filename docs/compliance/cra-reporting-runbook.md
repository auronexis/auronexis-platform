# CRA Incident & Vulnerability Reporting Runbook (Internal)

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Status:** OPERATIONAL READINESS DOCUMENTED — not a CRA compliance certification  
**Audience:** Security Owner, Incident Coordinator, Legal/Compliance Decision Owner  

**Related Part 1/2 artifacts (do not duplicate):**

- Applicability: `eu-legal-applicability-matrix.md` (CRA = POSSIBLE / LEGAL REVIEW REQUIRED)
- CVD intake: `vulnerability-disclosure-runbook.md`
- Public contact: `security@auroranexis.com`, `/.well-known/security.txt`
- Control: `CRA-VULN-001` in `eu-compliance-control-register.md`

**Authoritative sources (timing & route):**

- Regulation (EU) 2024/2847 — [EUR-Lex CELEX 32024R2847](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R2847)
- Article 14 (manufacturer reporting obligations)
- Article 16 (single reporting platform)
- Application of Article 14 from **11 September 2026** (Art. 71(3); Recital 126)

Do **not** send filings from this document alone. Do **not** claim Auroranexis is CRA-compliant.

---

## Operational flow

```
SECURITY EVENT DETECTED
→ RECORD TIME OF AWARENESS (UTC)
→ INITIAL VALIDATION
→ IS A PRODUCT WITH DIGITAL ELEMENTS INVOLVED?
→ IS CRA SCOPE CONFIRMED FOR THIS PRODUCT?
→ ACTIVELY EXPLOITED VULNERABILITY?
   OR
   SEVERE SECURITY INCIDENT?
→ LEGAL / SECURITY ESCALATION
→ 24H EARLY-WARNING DECISION
→ 72H MAIN-NOTIFICATION DECISION
→ MITIGATION / REMEDIATION
→ FINAL REPORT DECISION
→ EVIDENCE RETENTION
→ CLOSURE / LESSONS LEARNED
```

Not every security event is reportable. Continue CVD triage for researcher reports that are not exploited and not severe incidents.

---

## 1. Time-of-awareness control (required)

Regulatory clocks in Art. 14 run from the manufacturer becoming aware. Record in UTC.

| Field | Required |
|-------|----------|
| First signal timestamp (UTC) | Yes |
| First human review timestamp (UTC) | Yes |
| Confirmed awareness timestamp (UTC) | Yes — start of 24h/72h clocks when reportability applies |
| Timezone note | Always store UTC; may note local for operators |
| Person/role confirming awareness | Yes (role category) |
| Evidence source | Yes (alert, log, reporter email, monitor, etc.) |

No database table is required in Part 3. Use a private incident record linked to evidence checklist IDs.

---

## 2. Precondition: CRA scope gate

Before any SRP filing decision:

1. Is an Auroranexis-controlled product/component involved?
2. Is Auroranexis confirmed as CRA manufacturer for that product?  
   - If **no / unknown** → status `LEGAL REVIEW REQUIRED` (Part 1). Do **not** auto-file. Still contain, remediate, and preserve evidence.
3. Separate **INTERNAL SEVERITY** from **LEGAL REPORTABILITY** (see classification matrix).

Decision states for legal reportability:

| State | Meaning |
|-------|---------|
| REPORTING CANDIDATE | Scope confirmed + Art. 14 criteria met on evidence |
| NOT CURRENTLY REPORTABLE | Criteria not met on current evidence |
| INSUFFICIENT EVIDENCE | Need more facts before deciding |
| LEGAL REVIEW REQUIRED | Scope or legal severity uncertain |

“Probably exploited” must **not** automatically become a filing.

---

## 3. Actively exploited vulnerability decision tree

Legal definition reference: Art. 3(42) — reliable evidence that a malicious actor has exploited the vulnerability in a system without permission of the system owner (EUR-Lex). Good-faith research disclosure without malicious exploitation is not treated as mandatory notification under Recital 68.

Questions:

1. Is there a vulnerability affecting an Auroranexis-controlled product/component?
2. Is there **reliable evidence** that a malicious actor has exploited it?
3. Is exploitation active/current rather than hypothetical?
4. Which version(s) / deployment SHAs are affected?
5. Has exploitation affected customers or other persons?
6. Is the affected software within **confirmed** CRA scope?
7. What evidence supports active exploitation?
8. When did Auroranexis become aware? (UTC)

Outcome → one of the four decision states above.

---

## 4. Severe incident decision tree

Reference: Art. 14(3)–(5). An incident impacting product security is severe where it:

- negatively affects or is capable of negatively affecting the ability of the product to protect availability, authenticity, integrity, or confidentiality of sensitive/important data or functions; **or**
- has led or is capable of leading to introduction or execution of malicious code in the product or in the user’s network and information systems.

Assess (evidence-based; no invented numeric thresholds):

- loss of availability
- integrity compromise
- confidentiality compromise
- unauthorized access
- malicious code execution
- customer impact
- duration
- number of affected tenants/users (approximate, no unnecessary PII)
- geographic impact (Member States where product made available, if known)
- impact on security functionality
- recovery status

If legal severity remains uncertain → `LEGAL REVIEW REQUIRED`.

---

## 5. 24-hour early-warning workflow

**Statutory deadline (when CRA reporting applies):** early warning without undue delay and in any event within **24 hours** of awareness — Art. 14(2)(a) / Art. 14(4)(a).

**Internal readiness targets** (not CRA statutory deadlines except T+24):

| Time | Action |
|------|--------|
| T+0 | Confirmed awareness timestamp recorded (UTC) |
| T+2h | Security Owner assigned |
| T+4h | Initial legal/scope assessment started |
| T+12h | Reportability decision target |
| T+18h | Draft early warning prepared **if** reporting required |
| T+24h | Statutory early-warning deadline if CRA reporting applies |

Early warning should indicate, where applicable, Member States where the product has been made available, and for severe incidents whether unlawful/malicious cause is suspected (Art. 14).

---

## 6. 72-hour main notification workflow

**Statutory deadline (when CRA reporting applies):** vulnerability/incident notification without undue delay and in any event within **72 hours** of awareness — Art. 14(2)(b) / Art. 14(4)(b).

Prepare (as available; do not invent SRP schema):

- event summary
- affected product/version / deployment SHA
- vulnerability or incident description
- known exploitation
- severity assessment (internal + legal candidate status)
- impact
- mitigation already performed
- indicators / evidence references
- expected remediation
- affected markets/customers where known (no unnecessary PII)
- sensitivity indication for the notified information
- contact responsible for follow-up

**Important:** Actual submission fields must be taken from the **live ENISA Single Reporting Platform (SRP)** at filing time. This runbook does not define an SRP API or form schema.

---

## 7. Final-report workflow (do not merge deadlines)

### A. Actively exploited vulnerability

**Final report:** no later than **14 days after a corrective or mitigating measure is available** — Art. 14(2)(c).

Include at least (as required by Art. 14): vulnerability description/severity/impact; available information on malicious actor; details of the security update or other corrective measures.

### B. Severe incident

**Final report:** within **one month after the submission of the 72-hour incident notification** — Art. 14(4)(c).

Include at least: detailed description/severity/impact; likely threat/root cause; applied and ongoing mitigation measures.

Intermediate status updates may be requested by the CSIRT (Art. 14(6)).

---

## 8. Single Reporting Platform (SRP) readiness

| Item | Record |
|------|--------|
| Reporting system | CRA Single Reporting Platform |
| Operator | ENISA (Art. 16; Recital 69) |
| Effective Art. 14 date | **11 September 2026** |
| Recipient logic | CSIRT designated as coordinator (main establishment rules in Art. 14(7)) **and** ENISA via SRP |
| Auroranexis SRP status | **PENDING OPERATOR ONBOARDING** — no claim of registration or credentials |

### Operator onboarding checklist (future)

- [ ] SRP account/access available?
- [ ] Reporting organization configured?
- [ ] Relevant CSIRT confirmed (DE main-establishment analysis — LEGAL REVIEW)?
- [ ] Authorized reporters assigned?
- [ ] Backup reporter assigned?
- [ ] MFA/access secured?
- [ ] Emergency access documented?

Do **not** create SRP API clients, fake credentials, or simulated submissions in this program phase.

---

## 9. GDPR cross-check (mandatory)

Ask: **Could this involve a personal-data breach?**

| Answer | Action |
|--------|--------|
| YES / UNKNOWN with personal-data risk | Flag `GDPR BREACH ASSESSMENT REQUIRED` → existing control `GDPR-BREACH-001` |
| NO | Record negative assessment |

CRA reporting does **not** replace GDPR Arts. 33–34 duties.

---

## 10. Contractual / customer obligation assessment

Ask (operational, not automatic NIS2/DORA filing by Auroranexis):

Does this event trigger contractual notification duties to enterprise customers, NIS2-regulated customers, DORA-regulated customers, or strategic partners?

Record as: `CONTRACTUAL / CUSTOMER OBLIGATION ASSESSMENT`.  
See `nis2-dora-supplier-readiness.md`.

---

## 11. Customer communication checklist (internal — no automation)

Assess before any customer message:

- [ ] Customer impact confirmed?
- [ ] Workaround available?
- [ ] Action required by customer?
- [ ] Credentials reset required?
- [ ] Service degradation?
- [ ] Data exposure?
- [ ] Remediation deployed?
- [ ] Disclosure risks?
- [ ] Coordinated disclosure timing?
- [ ] Support response prepared?

Do **not** auto-send emails or publish public incident posts from this checklist. User notification duties under Art. 14(8) (when CRA reporting applies) remain a separate legal/communications decision.

---

## 12. Separate decision tracks

| Track | Question |
|-------|----------|
| REGULATORY REPORTING | Does Art. 14 require SRP early warning / notification / final report? |
| CUSTOMER NOTIFICATION | Do contracts / Art. 14(8) / duty of care require informing users? |
| PUBLIC DISCLOSURE | Is public technical disclosure appropriate and timed with CVD? |

These are **different** decisions. A CRA filing is not automatically a public disclosure; public disclosure is not automatically forbidden.

---

## 13. Existing Auroranexis systems usable as evidence

Reference only (no redesign in Part 3):

| System | Path / module | Use |
|--------|---------------|-----|
| Security incident registry | `security_incidents`, `src/lib/compliance/incidents.ts`, `docs/security-operations.md` | Incident narrative, severity, timeline fields |
| Audit events | `audit_events`, `src/lib/audit/**` | Access/change trail |
| CVD intake | `vulnerability-disclosure-runbook.md`, `security@` | Reporter-sourced vulns |
| Deploy / release | Git SHA, Vercel deploy, CI (`.github/workflows/ci.yml`) | Affected version / fix version |
| Health / monitoring | health probes, ops runbooks | Availability signals |
| DR / rollback | `docs/disaster-recovery.md`, `docs/rollback-plan.md` | Recovery evidence |

See `security-incident-evidence-checklist.md`.

---

## 14. Closure / lessons learned

Before close:

- [ ] Awareness timestamps complete
- [ ] Reportability decision recorded with state
- [ ] GDPR and contractual cross-checks recorded
- [ ] Evidence checklist completed
- [ ] If filed: SRP reference IDs stored (when available)
- [ ] Lessons learned note filed privately
