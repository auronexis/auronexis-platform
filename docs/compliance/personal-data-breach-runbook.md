# Personal data breach runbook (GDPR)

**Audience:** operators, security, and privacy owners  
**Status:** Practical runbook — not legal advice  
**Related:** `docs/compliance/security-incident-evidence-checklist.md`, Security Policy, DPA § personal data breaches

This runbook covers **personal data breaches** under GDPR Arts. 33–34. Not every security incident is a personal data breach, and **not every personal data breach requires supervisory authority or data-subject notification**.

## 1. Detection

Triggers may include: unauthorized access alerts, lost devices/credentials, misdirected email/exports, Ransomware/integrity events, Sentry anomalies with PII exposure, customer reports, sub-processor notices.

Record: detection time (UTC), detector, systems affected, whether personal data is involved (known / suspected / unknown).

## 2. Immediate containment

1. Stop ongoing exposure (revoke keys/sessions, disable compromised integrations, rotate only with operator approval — do not invent secret rotation from this doc alone).
2. Preserve evidence (logs, screenshots, ticket IDs) — do not destroy potentially relevant records.
3. Limit further processing of affected datasets where safe.
4. Open an internal security incident record and a compliance security-incident entry if available.

## 3. Roles

| Role | Responsibility |
|------|----------------|
| Incident owner | Coordinates timeline, decisions, evidence pack |
| Security lead | Technical containment and forensics |
| Privacy / DPO contact (if appointed) | Risk assessment, notification advice |
| Customer success / account owner | Customer communications when required |
| Legal counsel | Authority/DS notification decisions |

## 4. Impact assessment (document answers)

- Categories of personal data involved
- Approximate number of data subjects / customers
- Confidentiality / integrity / availability impact
- Likelihood of misuse and severity of consequences
- Whether Auroranexis acts as **controller** (own users/leads) or **processor** (customer workspace content)
- Whether a sub-processor caused or is affected

## 5. Controller vs processor path

- **Processor (customer content):** notify the **controller customer without undue delay** with available facts (nature, categories, approximate counts, likely consequences, measures taken). Assist their Art. 33/34 assessment — do not decide their authority notification for them.
- **Controller (platform accounts, marketing leads, own HR/vendor data):** perform Art. 33/34 assessment for Auroranexis as controller.

## 6. Supervisory authority notification assessment (72h clock)

Start the **72-hour assessment clock** from becoming aware of a personal data breach.

Assess whether the breach is **likely to result in a risk** to natural persons. If **not likely to result in a risk**, document the rationale and **do not notify** the authority solely because an incident occurred.

If notification appears required, prepare: nature of breach, categories/approximate numbers, DPO/contact, likely consequences, measures taken/proposed. Track submission deadline and actual submission time.

## 7. Data subject notification assessment

Assess whether the breach is **likely to result in a high risk** to natural persons. If high risk is not likely, document why DS notification is not performed. If required (or contractually promised), notify affected individuals without undue delay with clear language and recommended protective steps.

## 8. Documentation when not notifying

Retain: incident ID, awareness timestamp, assessment owner, risk conclusion, reasons notification not made, evidence references, review date.

## 9. Post-incident review

Within a defined window after containment: root cause, control gaps, retention of lessons learned, whether DPIA/RoPA updates are needed, customer follow-ups closed.

## Checklist fields (copy into the incident ticket)

- [ ] Detection timestamp (UTC)
- [ ] Awareness timestamp (UTC) — starts 72h assessment if personal data breach
- [ ] Incident owner
- [ ] Personal data involved? (Y/N/Unknown)
- [ ] Controller or processor role for this dataset
- [ ] Containment actions + evidence links
- [ ] Impact assessment completed
- [ ] Customer (controller) notified? (Y/N/NA) + time
- [ ] Authority notification required? (Y/N) + rationale
- [ ] Authority notified? (Y/N/NA) + time
- [ ] Data subject notification required? (Y/N) + rationale
- [ ] Data subjects notified? (Y/N/NA) + time
- [ ] If no notification: written rationale stored
- [ ] Post-incident review scheduled/completed
