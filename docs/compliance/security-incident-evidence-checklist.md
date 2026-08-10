# Security Incident Evidence Checklist (Internal)

**Baseline version:** 1.0.0 · **Date:** 2026-08-10  
**Use with:** `cra-reporting-runbook.md`, `vulnerability-disclosure-runbook.md`, PLD evidence baseline  
**Rule:** Preserve originals. Do not store secrets in evidence notes. Do not collect unnecessary personal data.

This checklist supports CRA Art. 14 readiness and general security incident evidence. Completing it does **not** mean Auroranexis is CRA-compliant.

---

## Evidence categories

| Category | Collect? | Notes |
|----------|----------|-------|
| Timestamps (UTC) | Required | First signal, first human review, confirmed awareness |
| Logs | As relevant | Prefer links/exports with retention; do not alter originals |
| Affected versions | Required when known | App version, feature flags |
| Deployment SHA | Required when known | Production deploy identifier |
| Git commit SHA | Required for code defects/fixes | Pre-fix and post-fix |
| Relevant configuration state | As relevant | Redact secrets |
| Vulnerability reproduction | As relevant | Minimum necessary to demonstrate |
| Screenshots | As relevant | Redact PII |
| Alerts | As relevant | Monitoring/health signals |
| API/network evidence | As relevant | No credential material |
| Customer impact evidence | As relevant | Aggregate counts preferred over identities |
| Remediation commit | When fixed | Link PR/commit |
| Test evidence | When fixed | CI run / manual verification notes |
| Deployment evidence | When fixed | Deploy time + SHA |
| Rollback evidence | If used | Procedure + outcome |
| Communications | As relevant | Reporter, internal, customer (as decided) |
| Decisions | Required | Reportability state, disclosure tracks |
| Legal assessments | Required when escalated | Scope / Art. 14 / GDPR flags |
| Regulatory filings / reference IDs | If later submitted | SRP IDs when available — none invented |

---

## Evidence integrity rules

1. Preserve originals; avoid modifying source logs.  
2. Record collection timestamp (UTC) and collector role.  
3. Link to evidence locations instead of copying secrets.  
4. Redact customer PII where not required for the decision.  
5. Preserve production deployment references and relevant CI results.  
6. Do not implement a cryptographic evidence vault in Part 3 — process discipline only.

---

## Existing systems that can supply evidence

| Source | Location |
|--------|----------|
| Security incidents | `security_incidents` / `src/lib/compliance/incidents.ts` |
| Audit trail | `audit_events` / `src/lib/audit/**` |
| CVD mailbox | `security@auroranexis.com` |
| Releases / CI | Git history, `.github/workflows/ci.yml` |
| Ops / DR | `docs/operations-runbook.md`, `docs/disaster-recovery.md`, `docs/rollback-plan.md` |

---

## Event evidence cover sheet (template fields)

```
Event ID:
Confirmed awareness (UTC):
Collector role:
INTERNAL SEVERITY:
CRA reporting candidate state:
GDPR cross-check:
Contractual/customer assessment:
Evidence index (paths/IDs):
Secrets excluded: YES/NO
```
