# Production Checklist — Phase 5 Sprint 0

**Target:** v0.95 Pilot / Production Infrastructure Ready  
**Environment:** Production  
**Prerequisite:** [staging-checklist.md](./staging-checklist.md) completed on staging

Complete every section before accepting pilot traffic or promoting beyond guided onboarding.

---

## Infrastructure prerequisites

- [ ] Staging validation report signed off ([staging-report.md](./staging-report.md))
- [ ] Production Supabase project separate from staging (no shared service role keys)
- [ ] All migrations applied including `20250624140000_production_infrastructure.sql`
- [ ] Daily database backups enabled; point-in-time recovery verified
- [ ] Deployment platform supports Node.js runtime (`runtime = "nodejs"` on cron and webhook routes)

---

## Secrets & environment

- [ ] Live Stripe keys (`sk_live_*`, live price IDs) configured — never reuse test keys
- [ ] `STRIPE_WEBHOOK_SECRET` from live webhook endpoint (not test mode secret)
- [ ] `CRON_SECRET` generated uniquely for production (rotate from staging value)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` stored in deployment secrets manager only
- [ ] All required env vars from [deployment.md](./deployment.md) plus `CRON_SECRET`
- [ ] Secret rotation procedure documented in [secrets.md](./secrets.md)

---

## Stripe production webhooks

- [ ] Live webhook URL: `https://<production-domain>/api/stripe/webhook`
- [ ] Events enabled: subscription lifecycle, invoice, checkout completion (per billing module)
- [ ] Idempotency verified: replay event → HTTP 200 with `duplicate: true`
- [ ] `billing_events.stripe_event_id` unique constraint prevents duplicate audit rows
- [ ] Zero unresolved `stripe_webhook_events` with `status = 'failed'` before go-live
- [ ] Stripe Dashboard → Webhooks shows successful delivery rate > 99%

---

## Cron scheduler (production)

- [ ] External cron service configured (Vercel Cron, GitHub Actions, Cloud Scheduler, or equivalent)
- [ ] Minimum schedule: every 5 minutes → `POST /api/cron/run`
- [ ] Authorization: `Bearer <CRON_SECRET>` on every request
- [ ] Health probe: GET `/api/cron/run` monitored separately (uptime check)
- [ ] Alerting on HTTP 401 (misconfigured secret) or HTTP 500 (dispatch failure)
- [ ] Alerting when `failedJobsLast24h > 5` (degraded) or `> 20` (unavailable) per diagnostics thresholds
- [ ] Job-specific force-run documented for incident response (`?job=<job_id>`)

### Registered jobs (must all be enabled)

| Job ID | Schedule | Purpose |
|--------|----------|---------|
| `report_schedules` | Hourly | Draft report generation |
| `sla_alerts` | Every 15 min | SLA breach evaluation |
| `connector_sync` | Every 6 hours | Connector synchronization |
| `billing_snapshots` | Daily 02:00 | Usage snapshots |
| `predictive_refresh` | Daily 03:00 | Forecast refresh |
| `automation_maintenance` | Weekly Sun 04:00 | Automation metadata pruning |
| `retention_cleanup` | Monthly 1st 05:00 | Retention simulation (no auto-delete) |
| `queue_worker` | Every 5 min | Background queue processing |

---

## Queue production hardening

- [ ] Queue worker cron running (backlog should stay near zero under normal load)
- [ ] Dead letter count monitored; alert when `deadLetters > 5` (degraded threshold)
- [ ] Pending queue alert when `jobsPending > 500` (unavailable threshold)
- [ ] Runbook for dead letter replay documented ([operations-runbook.md](./operations-runbook.md))
- [ ] Per-queue metrics reviewed in diagnostics (8 named queues)

---

## Monitoring & diagnostics

- [ ] Owner/admin can access Settings → Diagnostics in production
- [ ] **Production readiness** overall score ≥ 88 (Production Ready label)
- [ ] Pilot minimum: overall score ≥ 75 (Pilot Ready label)
- [ ] Stripe readiness, cron readiness, and queue readiness each ≥ 70 (table reachable minimum)
- [ ] External uptime monitor on app health and cron endpoint

---

## Security

- [ ] RLS verified on `stripe_webhook_events`, `job_*`, `queue_*` tables
- [ ] Cron endpoint not callable without bearer token in production
- [ ] Webhook signature verification enforced (no bypass paths)
- [ ] Service role key never exposed to client bundles or logs

---

## Business continuity

- [ ] [disaster-recovery.md](./disaster-recovery.md) reviewed and contacts assigned
- [ ] [operations-runbook.md](./operations-runbook.md) accessible to on-call
- [ ] Rollback plan: previous deployment tag documented
- [ ] Stripe webhook replay procedure tested

---

## Go / no-go

| Criterion | Required | Verified |
|-----------|----------|----------|
| Staging sign-off | Yes | ☐ |
| Migration applied | Yes | ☐ |
| Cron scheduler live | Yes | ☐ |
| Stripe idempotency tested | Yes | ☐ |
| Production readiness ≥ 75 | Yes (pilot) | ☐ |
| Production readiness ≥ 88 | Recommended | ☐ |
| On-call runbook distributed | Yes | ☐ |

**Production approved:** ☐ Pilot ☐ Full production ☐ Blocked
