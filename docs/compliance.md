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

## Framework evidence coverage (workspace maturity)

Per-framework percentages and the workspace compliance maturity score measure **tenant configuration and evidence** (policies, retention rules, audit events, exports). They are **gap analysis only** — not SOC 2, ISO 27001, GDPR, NIS2, DORA, or HIPAA certification.

**Platform capability** (schema / tables reachable) is separate and is what production readiness uses for go-live. A fresh workspace with 0% maturity and reachable tables is healthy infrastructure with not-yet-configured compliance content.

Formula (workspace maturity):

`retention% × 0.2 + min(activePolicies × 10, 30) + (audit > 0 ? 20 : 0) + (audit7d > 0 ? 5 : 0) + controlAverage × 0.3`

Controls contribute only with tenant-backed evidence; zero open incidents is not evidence of an incident program.

## Security

- Org isolation on all compliance tables
- Owner/admin access only
- Immutable audit events
- Export authorization checks
- No audit history modification or delete endpoints
- Evidence exports are read-only snapshots stored in the database
