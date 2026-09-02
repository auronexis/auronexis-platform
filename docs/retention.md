# Retention Policies

Retention policies define how long different data categories should be kept. The platform implements **simulation only** — **no automatic deletion**.

Public Privacy Policy language must stay aligned: do **not** claim that automatic deletion currently occurs.

## Operator categories (process view)

| Operator category | Examples | Auto-delete? |
|-------------------|----------|--------------|
| `LEGAL_HOLD_STATUTORY` | Legal holds, sales invoices, E-Invoice archive, mandatory accounting records | **Never** via retention job — counsel/statutory only |
| `CUSTOMER_DATA` | Client CRM operational records | Simulation only; offboarding / DSAR playbooks |
| `SECURITY_LOG` | Audit events, security incident evidence | Simulation only; retain while investigations require |
| `AI_LOG` | AI request logs / generation history | Simulation only |
| `MARKETING_LEAD` | Newsletter/contact leads + consent evidence | Manual suppression/erasure via DSAR/ops — no blind purge |
| `OPERATIONAL` | Notifications, connector sync history, executions | Simulation only |

## Product data categories (DB rules)

| Category | Label |
|----------|-------|
| `ai_logs` | AI logs |
| `reports` | Reports |
| `audit_events` | Audit events |
| `connector_sync_history` | Connector sync history |
| `executions` | Workflow/automation executions |
| `api_logs` | API request logs |
| `invoices` | Invoices (**do not enable destructive auto-delete**) |
| `notifications` | Notifications |
| `knowledge_entries` | Knowledge entries |
| `portal_activity` | Portal activity |

## Retention periods

`30d` | `90d` | `180d` | `1y` | `3y` | `7y` | `forever`

## Simulation mode

All default rules have `simulation_only: true`. The platform calculates coverage and displays policy status without deleting data. Cron `retention_cleanup` remains impact simulation (`autoDeleteEnabled: false`).

## Operator process (until enforcement exists)

1. Review `/dashboard/compliance` retention overview for intended periods.
2. For offboarding or DSAR erasure, follow `docs/compliance/dsar-operator-playbooks.md`.
3. Never purge sales invoices, E-Invoice archive rows, or legally retained accounting records through ad-hoc scripts without verified statutory analysis.
4. Record legal holds in `legal_holds` when deletion must be blocked in a future enforcement sprint.
5. Revisit Privacy Policy copy if/when auto-deletion is safely enabled.

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

Automatic purge jobs and hold-aware deletion remain out of scope until explicitly engineered, tested, and disclosed.

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
