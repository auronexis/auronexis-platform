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

## Client lifecycle (TARGET_MODEL: ARCHIVE_PLUS_RESTRICTED_HARD_DELETE)

| Path | Who | Effect |
|------|-----|--------|
| **Archive** (preferred) | Roles with `clients.write` | Sets `clients.status = archived`. Preserves operational history. Public API `DELETE /api/v1/clients/{id}` archives only. |
| **Hard delete** (restricted) | Owner/admin only, and only after the client is already archived | Deletes the `clients` row. Direct `ON DELETE CASCADE` / `SET NULL` child FKs apply to **operational** CRM data (risks, incidents, reports, schedules, portal users, health/CS/predictive rows, etc.). |

### Accounting / billing safety

Hard-deleting a client does **not** cascade organization billing identities, sales invoices, contract acceptances, Mollie webhook/subscription rows, or tax/invoice counters — those tables reference `organizations`, not `clients`.

### GDPR vs operational delete

- **Archive / hard delete** in Clients is an operational CRM lifecycle control.
- **Formal GDPR erasure / DSRs** remain under Compliance workflows and are not satisfied merely by clicking hard delete in the Clients UI.
- Do not treat client hard delete as a certified end-to-end GDPR erasure procedure.

### CASCADE blast radius (direct FKs to `public.clients`)

**ON DELETE CASCADE:** `risks`, `client_risks`, `incidents`, `reports`, `report_schedules`, `client_portal_users`, `client_financials`, `health_snapshots`, `predictive_snapshots`, `customer_success_playbook_instances` (+ tasks via playbook instance).

**ON DELETE SET NULL:** `sla_events.client_id`, `monitoring_events.client_id`, `portal_customer_onboarding.client_id`, `ai_request_logs.client_id`.

Transitive CASCADE from deleted parents (examples): report email deliveries → reports; incident activity / AI analysis → incidents; risk AI / mitigation rows → client_risks.

No schema CASCADE change was required for this decision; product controls enforce archive-first + owner/admin restriction.
