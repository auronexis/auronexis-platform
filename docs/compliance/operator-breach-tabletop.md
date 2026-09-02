# Operator Breach Tabletop — personal data breach

**Status:** `TABLETOP_READY_NOT_EXECUTED`  
**Audience:** operator / security / privacy owner (sole prop / small SaaS)  
**Related runbook:** [`personal-data-breach-runbook.md`](./personal-data-breach-runbook.md)  
**Related checklist:** [`security-incident-evidence-checklist.md`](./security-incident-evidence-checklist.md)  
**Rule:** Fictional scenario only. Do **not** rotate production secrets, delete logs, or notify authorities from this worksheet alone.

---

## Scenario (FICTIONAL)

**Title:** Accidental exposure of a workspace service token in application logs  

**Narrative:** During routine log review, an operator notices that a misconfigured debug path caused a **customer integration access token** (workspace connector credential) to appear in plaintext in application/error logs retained in the hosting/monitoring stack. The token could authenticate to a third-party system on behalf of one customer workspace. It is unknown whether any unauthorized party retrieved the log lines. Detection time: **T0** (UTC). Personal data may be indirectly involved (token tied to a named organization and possibly user identifiers in adjacent log fields).

**Assumptions for drill:** Single tenant affected; Mollie payment credentials **not** in the fictional log sample; no ransomware.

---

## Walkthrough — detection → 72h assessment → closure

### Phase 1 — Detection (T0)

| Step | Action | Evidence to capture |
|------|--------|---------------------|
| 1.1 | Record detection timestamp UTC, detector, systems (app logs / Sentry / Vercel logs) | Incident ticket stub |
| 1.2 | Classify: security incident **and** potential personal data breach? (known / suspected / unknown PD) | Runbook §1 |
| 1.3 | Open internal security incident + compliance `security_incidents` entry if available | Dashboard compliance / ops notes |

### Phase 2 — Immediate containment (T0 → T0+few hours)

| Step | Action | Notes |
|------|--------|-------|
| 2.1 | Revoke/rotate **the exposed customer token** via normal product/integration controls (tabletop: simulate only) | Do not invent broad secret rotation from this doc |
| 2.2 | Disable debug path / stop further token logging (tabletop: document intended fix) | Preserve already-collected evidence |
| 2.3 | Limit access to affected log streams | Need-to-know |
| 2.4 | Identify controller vs processor role for the dataset | Customer content / integration → often **processor** path |

### Phase 3 — Impact assessment

Document: categories of data; approximate subjects/customers; confidentiality impact; likelihood of misuse; sub-processor involvement (e.g. log host).

### Phase 4 — Controller vs processor path

| Role for this scenario | Expected path |
|------------------------|---------------|
| Processor (customer workspace integration token) | Notify **controller customer without undue delay** with available facts; assist their Art. 33/34 assessment — do **not** decide their authority notification for them |
| If any Auroranexis-controller data also exposed | Separate controller assessment |

### Phase 5 — 72-hour supervisory authority clock

- Start **72-hour assessment clock** from awareness of a personal data breach.  
- Assess whether breach is **likely to result in a risk** to natural persons.  
- If **not** likely → document rationale → **do not notify solely because an incident occurred**.  
- If likely → prepare Art. 33 content; track deadline vs submission.

**Tabletop decision fields (fill during drill — leave blank until executed):**

- Awareness timestamp: ________  
- Authority notification required? Y/N + rationale: ________  
- Customer (controller) notified? time: ________  

### Phase 6 — Data subject notification assessment

Assess **high risk** to natural persons. Document if DS notification not performed.

### Phase 7 — Closure & post-incident review

Root cause, control gaps, whether DPIA/RoPA updates needed, lessons learned, evidence pack retention.

---

## Drill execution record

| Field | Value |
|-------|--------|
| Executed? | **NO** — `TABLETOP_READY_NOT_EXECUTED` |
| Date of drill | — |
| Participants | — |
| Outcome summary | — |
| Follow-ups | — |

Operators: copy this worksheet into an internal ticket when running the first live tabletop; do not commit secrets or real customer identifiers into git.
