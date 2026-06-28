# Security Operations

Security operations tooling for incident tracking, monitoring signals, and audit-backed investigations.

## Security incident registry

Table: `security_incidents`

### Severity

`low` | `medium` | `high` | `critical`

### Status

`open` → `investigating` → `mitigated` → `resolved`

### Fields

| Field | Purpose |
|-------|---------|
| `title` | Incident summary |
| `description` | Detailed narrative |
| `impact` | Business/technical impact |
| `timeline` | JSON timeline entries |
| `affected_entities` | Related resources |
| `root_cause` | Post-investigation cause |
| `mitigation` | Remediation steps |
| `postmortem` | Post-incident review |

## Data access logs

Table: `data_access_logs`

Records sensitive resource access (resource type, action, user, IP, metadata). Owner/admin read-only via RLS.

## Compliance Center integration

`/dashboard/compliance` surfaces:

- Open security incident count
- Incident intake form
- Links to audit explorer for correlated events

## Diagnostics

Settings → Diagnostics → Compliance platform shows:

- Open security incidents
- Audit event growth
- Evidence availability

## Access control

All security operations data is org-isolated. Only organization owners and admins can view or manage incidents.

## Module

`src/lib/compliance/incidents.ts` and `src/lib/compliance/security.ts`
