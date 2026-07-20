# Database Audit — Sprint 10

> **Superseded for day-to-day standards.** Use
> [`docs/07_BUILD_BIBLE_V2_CHAPTER_05_DATABASE.md`](./07_BUILD_BIBLE_V2_CHAPTER_05_DATABASE.md)
> as the current source of truth. This file is retained as a historical Sprint 10 snapshot
> (2025-06-23, 30 migrations). The repo now has 65+ migrations including Paddle, predictive,
> executive intelligence, and customer-success tables.

**Version:** Auroranexis v0.9 RC  
**Date:** 2025-06-23  
**Migrations:** 30 files in `supabase/migrations/` (historical count)

## Summary

| Area | Result |
|------|--------|
| Migration inventory | **PASS** |
| Platform tables | **PASS** |
| Indexes | **PASS** (warnings) |
| Triggers | **PASS** (warnings) |
| Cron / scheduled jobs | **WARN** |
| Storage buckets | **PASS** (limited) |
| RLS coverage | **PASS** |
| Schema types sync | **PASS** |

---

## Migration inventory

30 sequential migrations from `20250623000000_foundation.sql` through `20250624130000_audit_compliance_platform.sql`. Helper script: `supabase/scripts/verify_automation_schema.sql`.

---

## Platform table verification

### Automation — PASS
`automation_workflows`, `automation_workflow_versions`, `automation_executions`, `automation_execution_steps`, `automation_webhooks`, `automation_org_state` — all with RLS and org indexes.

### Connectors — PASS
`integration_secrets`, `integration_delivery_logs`, `integration_connections`, `integration_oauth_states`, `integration_sync_jobs`.

### Billing — PASS
`organization_subscriptions`, `ai_usage_events`, `billing_usage_events`, `subscription_usage_snapshots`, `customer_invoices`, `discount_codes`, `billing_events`.

### Compliance — PASS
`audit_events`, `audit_exports`, `compliance_policies`, `retention_rules`, `data_access_logs`, `security_incidents`, `consent_records`, `gdpr_requests`, `legal_holds`.

---

## Indexes

### PASS
- Consistent `(organization_id, …)` indexing
- Partial indexes on active workflows, OAuth expiry, Stripe events

### WARN
- `billing_events.stripe_event_id` not UNIQUE
- `integration_sync_jobs` missing `(organization_id, status)` index
- `automation_executions` missing composite status/time index for dashboards

---

## Triggers

### PASS
- Shared `set_updated_at()` on 28 mutable tables

### WARN
- Audit capture is application-driven (no DB triggers on mutations)
- Append-only tables correctly omit update triggers

---

## Cron & scheduled jobs — WARN

No `pg_cron` or migration-level schedulers found. Background work currently triggered by:
- Dashboard load (SLA/escalation processors)
- Manual/user-initiated actions

**Impact:** Report schedules (`next_run_at`) and connector scheduled sync need external cron (Supabase Edge cron or Vercel cron) before production SLA guarantees.

---

## Storage buckets

### PASS
- `white-label-assets` — private, 2 MB, MIME-restricted, org-folder RLS

### WARN
- No dedicated buckets for PDF exports or audit artifacts (stored as DB/URLs)

---

## RLS & grants — PASS

All organization-owned tables use `current_organization_id()`. Service-role grants for webhook, audit insert, and billing write paths. `audit_events` immutable for authenticated users.

---

## TypeScript sync — PASS

`src/types/database.ts` includes compliance platform tables and exported view types.

---

## Validation commands

```bash
# Apply migrations (staging/prod via Supabase CLI)
supabase db push

# Verify automation schema
psql -f supabase/scripts/verify_automation_schema.sql
```

## Related

- [database.md](./database.md)
- [performance-audit.md](./performance-audit.md)
- [release-checklist.md](./release-checklist.md)
