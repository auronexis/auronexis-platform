# Audit System

The audit system makes major workspace actions traceable for security reviews, procurement, and compliance preparation.

## Event model

Each audit event captures:

| Field | Description |
|-------|-------------|
| `user_id` | Actor (nullable for system events) |
| `organization_id` | Tenant scope |
| `entity_type` | Resource category (client, report, workflow, etc.) |
| `entity_id` | Resource identifier |
| `event_type` | Action name (e.g. `client_created`, `api_key_created`) |
| `ip_address` | Request IP when available |
| `user_agent` | Client user agent when available |
| `source` | Origin (`system`, `api`, `dashboard`, etc.) |
| `metadata` | JSON context |
| `created_at` | Immutable timestamp |

## Recording events

Use `recordAuditEvent()` from `src/lib/audit/events.ts`. Events are append-only and inserted via the service role.

Example event types:

- `client_created`, `report_published`, `workflow_executed`
- `api_key_created`, `invoice_paid`, `connector_connected`
- `oauth_authorized`, `secret_rotated`, `branding_published`
- `automation_activated`, `ai_generation_completed`

## Timeline and search

`src/lib/audit/search.ts` merges dedicated `audit_events` with mapped `activity_events` for a unified timeline without modifying existing activity producers.

## Audit Explorer

Route: `/dashboard/compliance/audit`

Features:

- Timeline view with pagination
- Search by event type, entity, or metadata
- Entity type, date, and severity filters
- CSV and JSON export
- Evidence export (stored in `audit_exports`)

## Exports

Exports are authorized for owner/admin only. Completed exports are stored in `audit_exports.payload` and downloaded client-side. Export actions are themselves audited.

## Immutability

- No update or delete policies on `audit_events`
- No delete API for audit history
- Read-only evidence snapshots
