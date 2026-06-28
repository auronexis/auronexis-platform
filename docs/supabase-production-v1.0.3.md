# Supabase Production — v1.0.3

**Version:** 1.0.3  
**Status:** Launch Candidate

## Migrations

Apply through:

```
20250625200000_first_customer.sql
```

Use `supabase db push` or SQL Editor migration history.

## Validation

Run `supabase/scripts/validate_staging.sql` in production SQL Editor.

| Area | Check |
|------|-------|
| RLS | All public tenant tables enforce RLS |
| Storage | `white-label-assets` bucket exists |
| Policies | Storage objects scoped by organization folder |
| Health API | App `/api/health` probes database |
| Cron | `job_definitions` + `/api/cron/run` every 15 min |
| Queue | Pending queue jobs countable |

## Diagnostics probe

`src/lib/diagnostics/supabase-production-readiness.ts`

## Pre-launch

- [ ] Service role key in Vercel production only
- [ ] Anon key in all client environments
- [ ] No staging project URL in production env
