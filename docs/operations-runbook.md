# Operations Runbook — Phase 5 Production Infrastructure

**Version:** v0.95 · Phase 5 Sprint 0  
**Audience:** On-call engineers, platform operators  
**Related:** [production-checklist.md](./production-checklist.md) · [disaster-recovery.md](./disaster-recovery.md)

---

## Summary

Auroranexis production infrastructure spans three coordinated systems introduced in Phase 5 Sprint 0:

1. **Stripe webhook idempotency** — deduplicates Stripe deliveries via `stripe_webhook_events`
2. **Cron job dispatcher** — `/api/cron/run` executes registered background jobs on schedule
3. **Background queue** — durable job storage with retries, dead letters, and a `queue_worker` cron handler

All three systems expose health metrics in Settings → Diagnostics (owner/admin only).

---

## Key endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/stripe/webhook` | POST | Stripe signature | Subscription and billing sync |
| `/api/cron/run` | POST | `Bearer CRON_SECRET` | Execute due cron jobs |
| `/api/cron/run` | GET | `Bearer CRON_SECRET` | List registered jobs (health probe) |
| `/api/cron/run?job=<id>` | POST | `Bearer CRON_SECRET` | Force single job execution |

**Development note:** When `CRON_SECRET` is unset and `NODE_ENV=development`, cron auth is bypassed for local testing. This bypass does not apply in production.

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `CRON_SECRET` | Production | Bearer token for cron endpoint |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signature verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin client for jobs, queue, idempotency |

---

## Daily operations

### Morning health check (5 minutes)

1. Open Settings → Diagnostics as owner/admin.
2. Review **Production readiness** — overall score and label.
3. Confirm **Stripe webhooks**: table reachable, failed events = 0, recent last webhook timestamp.
4. Confirm **Cron infrastructure**: status = healthy, failed jobs (24h) ≤ 5.
5. Confirm **Queue infrastructure**: status = healthy, dead letters ≤ 5, pending backlog reasonable.
6. Verify external cron monitor shows successful POSTs to `/api/cron/run`.

### Weekly review

- Inspect `job_executions` for recurring failures by `job_id`.
- Review `queue_dead_letters` for patterns (same `job_type`, same error message).
- Confirm `job_schedules.next_run_at` values are in the future for all enabled jobs.

---

## Incident procedures

### Stripe webhooks failing

**Symptoms:** Stripe Dashboard shows delivery failures; diagnostics failed events increasing; billing out of sync.

**Steps:**

1. Check deployment logs for `[stripe] webhook` errors.
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard signing secret.
3. Query failed events:
   ```sql
   SELECT stripe_event_id, event_type, retry_count, error_message, last_attempt_at
   FROM stripe_webhook_events
   WHERE status = 'failed'
   ORDER BY last_attempt_at DESC
   LIMIT 20;
   ```
4. Fix root cause (handler bug, missing org, DB constraint).
5. Replay from Stripe Dashboard — idempotency allows safe retry (`status` transitions `failed` → `processing` → `processed`).

**Escalation:** If failures persist > 30 minutes, enable Stripe retry and notify billing stakeholders.

---

### Cron jobs not running

**Symptoms:** `job_schedules.last_run_at` stale; SLA alerts missed; queue backlog growing.

**Steps:**

1. Test health probe:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://<domain>/api/cron/run
   ```
2. If 401: verify `CRON_SECRET` in deployment matches scheduler configuration.
3. If 500: check logs for `[jobs]` or dispatch errors; inspect latest `job_executions` with `status = 'failed'`.
4. Force-run a specific job:
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     "https://<domain>/api/cron/run?job=sla_alerts"
   ```
5. Verify `job_executions` row created and schedule advanced.

**Escalation:** If scheduler platform is down, manually force-run critical jobs (`sla_alerts`, `queue_worker`) until restored.

---

### Queue backlog or dead letters

**Symptoms:** Diagnostics queue status = degraded/unavailable; high pending count; dead letters increasing.

**Steps:**

1. Check diagnostics per-queue breakdown (8 queues: emails, ai_generation, automation_execution, connector_sync, webhook_delivery, predictive_refresh, billing_sync, reports).
2. Force queue worker:
   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     "https://<domain>/api/cron/run?job=queue_worker"
   ```
3. Inspect stuck running jobs:
   ```sql
   SELECT id, queue_name, job_type, attempts, started_at, error_message
   FROM queue_jobs
   WHERE status = 'running'
   ORDER BY started_at ASC;
   ```
4. For jobs stuck in `running` > 15 minutes, manually reset to pending (incident only):
   ```sql
   UPDATE queue_jobs
   SET status = 'pending', started_at = NULL, scheduled_at = NOW()
   WHERE id = '<job-id>' AND status = 'running';
   ```

**Dead letter replay:**

1. Inspect payload:
   ```sql
   SELECT * FROM queue_dead_letters ORDER BY dead_at DESC LIMIT 10;
   ```
2. Re-enqueue via application code using same payload and a new idempotency key.
3. Delete or archive dead letter row after successful replay.

---

### Production readiness score drop

**Symptoms:** Overall score below 75 (Not Ready) or sudden drop in sub-scores.

| Sub-score | Common cause | Action |
|-----------|--------------|--------|
| Stripe readiness | Failed webhook events | See Stripe procedure above |
| Cron readiness | > 5 failures in 24h | Inspect `job_executions` |
| Queue readiness | Dead letters or backlog | See queue procedure above |
| Billing readiness | Stripe not connected | Verify env keys and subscription row |
| API readiness | Failed public API requests | Check API diagnostics section |

---

## Job reference

| Job ID | Handler | Default interval |
|--------|---------|------------------|
| `report_schedules` | `processDueReportSchedules` | 1 hour |
| `sla_alerts` | `processSlaAlertsJob` | 15 minutes |
| `connector_sync` | `processConnectorSyncJob` | 6 hours |
| `billing_snapshots` | `processBillingSnapshotsJob` | 24 hours |
| `predictive_refresh` | `processPredictiveRefreshJob` | 24 hours |
| `automation_maintenance` | `processAutomationMaintenanceJob` | 7 days |
| `retention_cleanup` | `processRetentionCleanupJob` | 30 days |
| `queue_worker` | `processQueueWorkerJob` | 5 minutes |

Each run creates a `job_executions` row, records duration, and advances `job_schedules.next_run_at` even on failure (prevents stuck schedules).

---

## Diagnostics access

Path: **Settings → Diagnostics** (requires owner or admin role).

Infrastructure sections added in Phase 5 Sprint 0:

- Stripe webhooks
- Cron infrastructure
- Queue infrastructure
- Production readiness (composite score)

See [diagnostics-report.md](./diagnostics-report.md) for field definitions and threshold logic.

---

## Escalation contacts

| Severity | Condition | Response time |
|----------|-----------|---------------|
| P1 | Billing webhooks down > 1 hour | 15 minutes |
| P1 | Cron completely stopped > 30 minutes | 15 minutes |
| P2 | Queue dead letters > 20 | 1 hour |
| P3 | Degraded diagnostics (non-zero failed webhooks) | Next business day |

Document actual contact names and paging channels in your organization's internal wiki.
