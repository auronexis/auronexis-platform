# Disaster Recovery — Phase 5 Production Infrastructure

**Version:** v0.95 · Phase 5 Sprint 0  
**RTO target:** 4 hours (pilot) · **RPO target:** 24 hours (Supabase daily backup)  
**Related:** [operations-runbook.md](./operations-runbook.md) · [production-checklist.md](./production-checklist.md)

---

## Summary

Disaster recovery for Auroranexis Phase 5 infrastructure focuses on restoring database state, replaying missed background work, and re-establishing external integrations (Stripe webhooks, cron scheduler). The idempotency and queue layers are designed to tolerate replay without duplicate side effects when procedures below are followed.

---

## Scope

| System | Data store | Recovery mechanism |
|--------|------------|-------------------|
| Stripe webhooks | `stripe_webhook_events`, `billing_events` | Stripe Dashboard replay + idempotency |
| Cron jobs | `job_definitions`, `job_schedules`, `job_executions` | Reschedule + force-run |
| Background queue | `queue_jobs`, `queue_dead_letters` | Re-enqueue from dead letters |
| Application | Deployment platform | Redeploy last known good tag |

---

## Recovery tiers

### Tier 1 — Partial degradation (single component)

**Examples:** Cron scheduler misconfigured, queue worker stalled, transient Stripe failures.

**Response:**

1. Follow incident procedures in [operations-runbook.md](./operations-runbook.md).
2. No full restore required.
3. Verify diagnostics return to healthy status within 1 hour.

### Tier 2 — Database restore required

**Examples:** Accidental data corruption, failed migration, Supabase region outage with restore.

**Response:**

1. Restore Supabase backup to new project or point-in-time recovery snapshot.
2. Update deployment env vars to restored project URL and keys.
3. Re-apply any migrations newer than backup if using manual restore.
4. Execute post-restore validation (see below).

### Tier 3 — Full platform loss

**Examples:** Deployment account compromise, complete hosting loss.

**Response:**

1. Provision new deployment from git tag.
2. Restore Supabase from backup.
3. Rotate all secrets: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `STRIPE_*`, `INTEGRATION_SECRET_KEY`.
4. Re-register Stripe webhook endpoint with new signing secret.
5. Reconfigure external cron scheduler.
6. Full validation checklist before traffic.

---

## Post-restore validation

### Database integrity

```sql
-- Infrastructure tables exist
SELECT COUNT(*) FROM job_definitions;        -- expect 8
SELECT COUNT(*) FROM job_schedules;          -- expect 8
SELECT to_regclass('public.stripe_webhook_events');
SELECT to_regclass('public.queue_jobs');
SELECT to_regclass('public.queue_dead_letters');

-- Unique constraints intact
SELECT indexname FROM pg_indexes
WHERE tablename IN ('stripe_webhook_events', 'billing_events', 'queue_jobs')
  AND indexdef LIKE '%UNIQUE%';
```

### Stripe idempotency

1. Send test webhook from Stripe Dashboard.
2. Confirm row in `stripe_webhook_events` with `status = 'processed'`.
3. Replay same event — confirm `duplicate: true` response and no duplicate billing rows.

### Cron recovery

1. Reset schedules if `next_run_at` is far in the past after long outage:
   ```sql
   UPDATE job_schedules SET next_run_at = NOW();
   ```
2. Force-run all jobs sequentially via `?job=<id>` or single POST to dispatch due jobs.
3. Verify `job_executions` shows recent completed runs.

### Queue recovery

1. Reset orphaned running jobs:
   ```sql
   UPDATE queue_jobs
   SET status = 'pending', started_at = NULL, scheduled_at = NOW()
   WHERE status = 'running';
   ```
2. Force-run `queue_worker` job.
3. Process dead letters manually if outage exceeded retry windows.

---

## Stripe event replay procedure

After database restore, billing state may lag Stripe's source of truth.

**Safe replay order:**

1. `customer.subscription.updated`
2. `invoice.paid` / `invoice.payment_failed`
3. `checkout.session.completed`

**Steps:**

1. Open Stripe Dashboard → Developers → Events.
2. Filter by affected customer or time range during outage.
3. Resend events individually (not bulk) during initial recovery.
4. Monitor `stripe_webhook_events` — expect `processed` or `duplicate`, never unhandled duplicates in `billing_events`.

**Idempotency guarantee:** `ensureStripeIdempotency` returns `duplicate` for already-processed event IDs. Failed events transition to `retry` on Stripe resend.

---

## Cron gap backfill

If cron was offline for interval `T`:

| Job | Backfill strategy |
|-----|-------------------|
| `sla_alerts` | Force-run immediately; review SLA breach notifications for gap period |
| `report_schedules` | Force-run; schedules with overdue `next_run_at` processed in handler |
| `connector_sync` | Force-run; connectors sync on next successful run |
| `billing_snapshots` | Accept gap or manually trigger if billing audit requires daily snapshot |
| `queue_worker` | Force-run repeatedly until pending count = 0 |

```bash
# Dispatch all due jobs
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://<domain>/api/cron/run

# Force critical jobs
for job in sla_alerts queue_worker report_schedules; do
  curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
    "https://<domain>/api/cron/run?job=$job"
done
```

---

## Queue dead letter recovery

Dead letters preserve full job context for manual replay.

```sql
SELECT id, queue_name, job_type, payload, error_message, attempts, dead_at
FROM queue_dead_letters
ORDER BY dead_at DESC;
```

Replay via server-side `dispatchQueueJob` with:

- Same `queueName`, `jobType`, `payload`
- **New** `idempotencyKey` (append `-replay-<timestamp>`)

After successful processing, archive the dead letter row.

---

## Secret rotation after compromise

| Secret | Rotation action |
|--------|-----------------|
| `CRON_SECRET` | Generate new value; update deployment + scheduler simultaneously |
| `STRIPE_WEBHOOK_SECRET` | Roll signing secret in Stripe; update env; verify delivery |
| `SUPABASE_SERVICE_ROLE_KEY` | Rotate in Supabase dashboard; update deployment immediately |
| `STRIPE_SECRET_KEY` | Roll in Stripe; update env; no webhook replay needed |

**Order:** Deploy new secrets → verify health probes → revoke old secrets.

---

## Backup requirements

| Asset | Frequency | Retention | Owner |
|-------|-----------|-----------|-------|
| Supabase database | Daily (minimum) | 30 days | Platform |
| Deployment config / env | On change | Version controlled | Engineering |
| Stripe event log | Stripe-managed | Per Stripe policy | Billing |

Enable Supabase point-in-time recovery for production before pilot launch.

---

## Pilot readiness notes

- DR procedures tested on staging at least once before production pilot.
- Document actual RTO/RPO achieved during staging drill in [staging-report.md](./staging-report.md).
- Idempotency layer eliminates duplicate billing risk during replay — critical for pilot confidence.
- Queue dead letters provide audit trail for jobs lost during outage windows.

**Target:** v0.95 infrastructure supports pilot DR with documented replay paths; enterprise multi-region DR remains a future phase.
