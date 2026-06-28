# Supabase Staging Validation

**Version:** Auroranexis v0.97  
**Use after:** `supabase db push` on staging project

---

## Apply migrations

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or run migrations manually in Supabase Dashboard → SQL Editor (ordered by filename).

Latest infrastructure migration: `20250624140000_production_infrastructure.sql`

---

## Validation script

Run `supabase/scripts/validate_staging.sql` in SQL Editor.

Expected results:

| Check | Expected |
|-------|----------|
| Recent migrations | Includes `20250624140000` |
| Public table count | 80+ tables |
| RLS enabled count | Matches sensitive tables |
| Tables missing RLS | Empty or intentional service tables only |
| Storage buckets | `white-label-assets` (and any app buckets) |
| `job_definitions` | 8 rows |
| `job_schedules` | 8 rows |

---

## RLS validation

All tenant-scoped tables must have RLS enabled with policies using:

- `public.current_organization_id()`
- `public.current_user_role()`

Spot-check in Dashboard → Authentication → Policies:

- [ ] `clients`, `reports`, `risks`, `incidents`
- [ ] `integration_connections`, `integration_secrets`
- [ ] `automation_workflows`, `queue_jobs`
- [ ] `billing_events`, `customer_invoices`
- [ ] `audit_events`, `gdpr_requests`

Service role bypasses RLS — use only server-side (`SUPABASE_SERVICE_ROLE_KEY`).

---

## Storage buckets

From `20250624110000_white_label_platform.sql`:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `white-label-assets` | Yes | Logos, favicons |

Verify:

- [ ] Bucket exists
- [ ] Upload policy allows org owners/admins
- [ ] Public read for published assets

---

## Auth

Supabase Dashboard → Authentication:

- [ ] Email provider enabled
- [ ] Site URL: `https://staging.auroranexis.com`
- [ ] Redirect URLs include:
  - `https://staging.auroranexis.com/auth/callback`
  - `http://localhost:3000/auth/callback` (dev)

---

## SMTP (optional)

For report email delivery:

- [ ] Custom SMTP configured in Supabase **or** use Resend via app (`RESEND_API_KEY`)
- [ ] Test magic link / password reset on staging

App uses Resend for report delivery — Supabase SMTP only needed for auth emails.

---

## Migration history

```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

Document last applied version in deployment notes.

---

## Diagnostics alignment

After deploy, owner account → Settings → Diagnostics:

- [ ] Database latency OK
- [ ] Stripe webhooks table reachable
- [ ] Cron jobs registered
- [ ] Queue tables reachable
- [ ] Production readiness score ≥ 85

---

## Demo workspace

After owner signup (`aurora-demo` slug):

```bash
# SQL Editor
\i supabase/scripts/seed_demo_workspace.sql
```

Verify counts in validate script output.

---

## Related

- [database-audit.md](./database-audit.md)
- [disaster-recovery.md](./disaster-recovery.md)
- [demo-tenant.md](./demo-tenant.md)
