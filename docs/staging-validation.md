# Staging Validation Report

**Date:** 2025-06-23  
**Version:** v0.99.0  
**Environment:** `staging.auroranexis.com`  
**Supabase project:** Staging (isolated from production)

---

## Summary

Staging validation confirms database migrations, RLS, storage, infrastructure tables, and demo workspace readiness before first pilot customer onboarding.

**Validation script:** `supabase/scripts/validate_staging.sql`

---

## Migrations

| Check | Procedure | Expected |
|-------|-----------|----------|
| Schema current | `supabase db push` on staging | No pending migrations |
| Migration history | Query `supabase_migrations.schema_migrations` | Latest migration applied |
| Public table count | `validate_staging.sql` | Matches expected schema (~80+ tables) |

---

## Auth

| Check | Status |
|-------|--------|
| Email/password signup | Verify on staging URL |
| Session persistence | Refresh + redirect OK |
| Supabase Auth redirect URLs | Include `staging.auroranexis.com` |
| Portal auth (separate flow) | `/client-portal/login` |

---

## RLS

| Check | Expected |
|-------|----------|
| RLS enabled count | All tenant tables |
| Tables missing RLS | Empty or service-only (audit in SQL script) |
| Cross-org isolation | Manual spot-check with two test orgs |

**Action if gaps found:** Add policy migration; re-run validation script.

---

## Storage buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| White label assets | Org branding uploads | Private (signed URLs) |
| Report exports | PDF storage | Private |

**Common issues:**

- Missing bucket → run storage migration
- RLS on `storage.objects` → verify org-scoped policies
- File size limits → align with plan limits

---

## Infrastructure tables

Validated by `validate_staging.sql`:

| Table group | Tables |
|-------------|--------|
| Billing | `stripe_webhook_events`, `customer_invoices`, subscriptions |
| Queue | `queue_jobs` |
| Cron | `job_definitions`, `job_schedules` |
| Connectors | `integration_connections`, connector secrets vault |
| Compliance | policies, retention, GDPR requests, security incidents |
| Predictive | forecast cache tables |
| Automation | `automation_workflows` |

---

## Demo workspace (`aurora-demo`)

| Asset | Expected count |
|-------|----------------|
| Clients | 10 |
| Reports | 20 |
| Risks | 8 |
| Incidents | 5 |
| Automations | 5 |
| Connectors (display) | 3 |
| Invoices | 2 |

**Seed:** `supabase/scripts/seed_demo_workspace.sql` (after owner signup)

See [demo-tenant.md](./demo-tenant.md) and [demo-workspace-report.md](./demo-workspace-report.md).

---

## Connector secrets

- [ ] `INTEGRATION_SECRET_KEY` set (64-char hex)
- [ ] OAuth tokens encrypted at rest
- [ ] Revoke flow clears connection row

---

## Performance concerns

| Area | Watch for | Mitigation |
|------|-----------|------------|
| Large org lists | Slow client queries | Pagination (in-app) |
| Webhook replay | Duplicate processing | Idempotency table (verified) |
| Cron backlog | Stale `job_schedules` | Monitor diagnostics |
| Storage egress | White label asset delivery | CDN via Supabase signed URLs |

---

## Missing policies report template

Run `validate_staging.sql` section **Tables missing RLS**. Document any results:

| Table | Severity | Action |
|-------|----------|--------|
| _(none expected)_ | — | — |

---

## Sign-off

| Gate | Owner | Status |
|------|-------|--------|
| Migrations applied | Engineering | Pending operator |
| RLS audit clean | Engineering | Pending operator |
| Demo workspace seeded | Sales/Ops | Pending operator |
| Health endpoint green | Engineering | Pending operator |

---

## Related

- [supabase-staging.md](./supabase-staging.md)
- [deployment-v0.99.md](./deployment-v0.99.md)
- [production-readiness-v0.99.md](./production-readiness-v0.99.md)
