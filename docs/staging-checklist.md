# Staging Checklist — Phase 5 Sprint 0

**Target:** v0.95 Pilot / Production Infrastructure Ready  
**Environment:** Staging (pre-production validation)  
**Scope:** Stripe idempotency, cron jobs, background queue, diagnostics

Use this checklist before promoting staging to pilot customers or using staging as a production dress rehearsal.

---

## Database & migrations

- [ ] Migration `20250624140000_production_infrastructure.sql` applied successfully
- [ ] Table `stripe_webhook_events` exists with unique index on `stripe_event_id`
- [ ] Partial unique index on `billing_events.stripe_event_id` (WHERE NOT NULL) exists
- [ ] Tables `job_definitions`, `job_schedules`, `job_executions` seeded with 8 registered jobs
- [ ] Tables `queue_jobs` and `queue_dead_letters` exist with RLS enabled
- [ ] RLS policies allow owner/admin SELECT on tenant-scoped infrastructure tables
- [ ] Service role can read/write all infrastructure tables (cron and queue workers)

---

## Environment variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only; required for cron, queue, webhooks)
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and publishable key configured (test mode)
- [ ] All four plan price IDs configured (`STRIPE_*_PRICE_ID`)
- [ ] `CRON_SECRET` set to a strong random value (minimum 32 characters)
- [ ] `NEXT_PUBLIC_APP_URL` matches staging deployment URL
- [ ] `OPENAI_API_KEY` and `AI_PROVIDER` set if AI diagnostics are in scope

---

## Stripe webhooks

- [ ] Stripe test webhook endpoint points to `https://<staging-domain>/api/stripe/webhook`
- [ ] Signing secret matches `STRIPE_WEBHOOK_SECRET`
- [ ] Send test event (e.g. `customer.subscription.updated`) and confirm HTTP 200
- [ ] Resend same event ID — response includes `{ duplicate: true }` and no double billing side effects
- [ ] Diagnostics → **Stripe webhooks**: table reachable, processed count increments, duplicates prevented increments on replay
- [ ] Failed handler path: confirm `stripe_webhook_events.status = 'failed'` and Stripe retry succeeds

---

## Cron infrastructure

- [ ] External scheduler configured to POST `https://<staging-domain>/api/cron/run` every 5 minutes
- [ ] Scheduler sends `Authorization: Bearer <CRON_SECRET>` header
- [ ] GET `/api/cron/run` with same auth returns `{ ok: true, jobs: [...] }` (health probe, no execution)
- [ ] POST without auth returns 401 (except in local `NODE_ENV=development` without secret)
- [ ] POST with `?job=sla_alerts` forces a single job run and returns execution metadata
- [ ] `job_executions` rows appear with `completed` or `failed` status after runs
- [ ] `job_schedules.next_run_at` advances after each successful or failed run
- [ ] Diagnostics → **Cron infrastructure**: tables reachable, registered jobs = 8, status = healthy

---

## Queue infrastructure

- [ ] Enqueue a test job via server action or admin script using `dispatchQueueJob`
- [ ] `queue_worker` cron job processes pending jobs (runs every 5 minutes via `*/5 * * * *`)
- [ ] Failed jobs retry with exponential backoff (`calculateRetryDelayMs`: base 1s, max 5 min)
- [ ] Jobs exceeding `max_attempts` (default 5) move to `queue_dead_letters`
- [ ] Idempotency key prevents duplicate active jobs on same queue
- [ ] Diagnostics → **Queue infrastructure**: pending/running/failed counts accurate, dead letters visible

---

## Diagnostics & readiness

- [ ] Settings → Diagnostics loads for owner/admin without errors
- [ ] **Stripe webhooks**, **Cron infrastructure**, **Queue infrastructure**, and **Production readiness** sections render
- [ ] Production readiness overall score ≥ 75 (Pilot Ready threshold)
- [ ] Target staging score ≥ 88 for Production Ready rehearsal
- [ ] No secrets displayed in diagnostics (presence flags only)

---

## Functional smoke

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Report schedule cron generates draft reports for due schedules
- [ ] SLA alerts job runs without unhandled exceptions
- [ ] Billing snapshots job completes (check `job_executions` metadata)

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Operations | | | |
| Product | | | |

**Staging approved for pilot:** ☐ Yes ☐ No — blockers documented in [staging-report.md](./staging-report.md)
