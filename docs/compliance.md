# Compliance Platform

Phase 4 Sprint 9 adds governance, auditability, and compliance readiness infrastructure to Auroranexis — without modifying authentication, RBAC, Stripe, AI, automation/workflow engines, connectors, Public API business logic, billing, or white label.

## Architecture

```
audit_events + activity_events (merged timeline)
        ↓
compliance/ + audit/ + governance/ modules
        ↓
/dashboard/compliance + /dashboard/compliance/audit
        ↓
Settings → Diagnostics (Compliance platform section)
```

### Module layout

| Path | Purpose |
|------|---------|
| `src/lib/compliance/` | Policies, retention, GDPR, incidents, exports, diagnostics |
| `src/lib/audit/` | Immutable event recording, search, timeline, export |
| `src/lib/governance/` | Framework readiness, controls, evidence, checklists |

## Database

Migration: `supabase/migrations/20250624130000_audit_compliance_platform.sql`

### Tables

| Table | Purpose |
|-------|---------|
| `audit_events` | Immutable org-scoped audit trail (service_role insert) |
| `audit_exports` | CSV/JSON/evidence export records |
| `compliance_policies` | Framework policy definitions |
| `retention_rules` | Simulated retention policies per data category |
| `data_access_logs` | Sensitive resource access log |
| `security_incidents` | Security incident registry |
| `consent_records` | Consent tracking |
| `gdpr_requests` | Data subject request workflow |
| `legal_holds` | Legal hold registry |

### RLS

All tables are org-isolated. Owner/admin can read and manage (except `audit_events`, which is **SELECT-only** for authenticated users). Inserts to `audit_events` use the service role. Audit history has no delete endpoint.

## UI

| Route | Access | Purpose |
|-------|--------|---------|
| `/dashboard/compliance` | Owner/admin | Compliance score, frameworks, GDPR, incidents, retention, evidence |
| `/dashboard/compliance/audit` | Owner/admin | Audit explorer with search, filters, exports |

## Framework readiness

Readiness scoring is provided for SOC2, ISO27001, GDPR, NIS2, DORA, and HIPAA (placeholder). These scores indicate internal readiness only — **no certification claims**.

## Security

- Org isolation on all compliance tables
- Owner/admin access only
- Immutable audit events
- Export authorization checks
- No audit history modification or delete endpoints
- Evidence exports are read-only snapshots stored in the database
