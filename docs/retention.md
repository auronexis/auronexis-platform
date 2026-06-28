# Retention Policies

Retention policies define how long different data categories should be kept. Sprint 9 implements **simulation only** — no automatic deletion.

## Data categories

| Category | Label |
|----------|-------|
| `ai_logs` | AI logs |
| `reports` | Reports |
| `audit_events` | Audit events |
| `connector_sync_history` | Connector sync history |
| `executions` | Workflow/automation executions |
| `api_logs` | API request logs |
| `invoices` | Invoices |
| `notifications` | Notifications |
| `knowledge_entries` | Knowledge entries |
| `portal_activity` | Portal activity |

## Retention periods

`30d` | `90d` | `180d` | `1y` | `3y` | `7y` | `forever`

## Simulation mode

All default rules have `simulation_only: true`. The platform calculates coverage and displays policy status without deleting data.

## Coverage metric

Retention coverage % = enabled categories with configured rules / total categories.

Visible in:

- `/dashboard/compliance` retention overview
- Settings → Diagnostics → Compliance platform

## Legal holds

Table: `legal_holds` — active holds that would block deletion when enforcement is enabled in a future sprint.

## Module

`src/lib/compliance/retention.ts`

Table: `retention_rules`

## Future work

Automatic purge jobs and hold-aware deletion are out of scope for Sprint 9.
