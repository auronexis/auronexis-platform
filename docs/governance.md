# Governance Engine

The governance engine provides framework readiness scoring and control checklists for enterprise procurement and security reviews.

## Frameworks

Readiness layers (no certification claims):

| Framework | Status |
|-----------|--------|
| SOC 2 | Readiness scoring |
| ISO 27001 | Readiness scoring |
| GDPR | Readiness scoring |
| NIS2 | Readiness scoring |
| DORA | Readiness scoring |
| HIPAA | Placeholder readiness |

## Controls

Sixteen governance controls are evaluated from existing platform signals:

- Identity, Encryption, Logging, Monitoring
- Backups, Secrets, Retention, Auditing
- Incident Management, Access Control, API Security
- Vendor Management, Business Continuity
- Risk Management, Change Management, Evidence Management

## Outputs

| Output | Description |
|--------|-------------|
| Compliance % | Weighted control pass rate |
| Maturity Score | Implementation depth |
| Readiness Level | Qualitative band (initial/developing/defined/managed/optimized) |
| Recommendations | Action items to improve readiness |

## Module layout

| File | Purpose |
|------|---------|
| `src/lib/governance/frameworks.ts` | Framework definitions |
| `src/lib/governance/controls.ts` | Control catalog and scoring |
| `src/lib/governance/readiness.ts` | Overall readiness calculation |
| `src/lib/governance/evidence.ts` | Evidence snapshot assembly |
| `src/lib/governance/checklists.ts` | Framework comparison checklists |

## UI

Visible on `/dashboard/compliance`:

- Compliance score and readiness %
- Framework comparison cards
- Controls checklist
- Open findings from control gaps

## Important

Readiness scores reflect internal platform capabilities only. They do not represent third-party audit results or certifications.
