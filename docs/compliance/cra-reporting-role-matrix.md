# CRA Reporting Role Matrix (Internal)

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Rule:** Roles only — no personal employee names. Each role must have a designated backup before 11 September 2026 readiness drills.

Canonical public intake mailbox remains `security@auroranexis.com` (Part 2).

---

| Role | Responsibilities | 24h responsibilities | 72h responsibilities | Final-report responsibilities | Backup role requirement |
|------|------------------|----------------------|----------------------|-------------------------------|-------------------------|
| **Security Owner** | Owns security event intake quality, exploitation assessment, evidence integrity | Confirm awareness UTC; assign Incident Coordinator; start actively exploited / severe trees | Complete vulnerability/incident notification draft inputs; sensitivity rating | Validate technical accuracy of final report content | Engineering Owner or Incident Coordinator |
| **Engineering Owner** | Reproduction, containment, fix, verification, version/SHA identification | Provide affected versions/SHAs; contain if safe | Document mitigations and user-actionable measures | Supply fix/mitigation details and verification evidence | Security Owner |
| **Product Owner** | Product impact framing; user-facing risk wording (not legal conclusions) | Confirm product surfaces affected | Review customer-impact narrative | Confirm remediation messaging for users if required | Security Owner |
| **Legal/Compliance Decision Owner** | CRA scope confirmation; reportability state; SRP filing authorization | Scope gate + LEGAL REVIEW REQUIRED decisions | Authorize 72h notification if reporting applies | Authorize final report; retain legal assessment notes | Executive Escalation |
| **Data Protection Owner** | GDPR personal-data breach cross-check (`GDPR-BREACH-001`) | Flag GDPR BREACH ASSESSMENT REQUIRED | Coordinate parallel GDPR path (does not replace CRA) | Confirm GDPR closure notes independent of CRA | Legal/Compliance Decision Owner |
| **Incident Coordinator** | Single thread of record; timestamps; checklists; escalations | Drive T+2…T+24 internal readiness targets | Drive 72h package assembly | Drive final-report calendar (14-day vs one-month paths) | Security Owner |
| **Communications Owner** | Customer/public messaging decisions (separate from SRP filing) | Prepare holding statements only if impact confirmed | Align customer notification checklist | Align public disclosure vs regulatory reporting | Product Owner |
| **Executive Escalation** | Critical decisions when Legal/Security disagree or impact is CRITICAL | Informed within T+4h for CRITICAL | Approve high-impact customer/regulatory strategy | Approve final closure for CRITICAL events | Legal/Compliance Decision Owner |

---

## Authorization note

Only the **Legal/Compliance Decision Owner** (or Executive Escalation when delegated) may authorize an SRP submission **if and when** CRA scope is confirmed and Art. 14 criteria are met. No automated submission.

SRP operator onboarding status: **PENDING OPERATOR ONBOARDING** (see CRA reporting runbook).
