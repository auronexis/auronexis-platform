# Queue Infrastructure Report — Phase 5 Sprint 0

**Date:** 2025-06-27  
**Sprint:** Phase 5 Sprint 0 — Production Infrastructure  
**Target:** v0.95 Pilot / Production Infrastructure Ready

---

## Summary

Auroranexis includes a durable background queue stored in Supabase: jobs are enqueued server-side, claimed atomically by a worker, retried with exponential backoff, and moved to a dead-letter table after max attempts. The `queue_worker` cron job processes up to 25 jobs per run every 5 minutes. Metrics and health feed the diagnostics panel.

**Status:** Infrastructure complete. Job type handlers in `processQueueJob` are stubbed for `predictive.refresh` and `connector.sync` — enqueue/dispatch/retry/dead-letter paths are production-ready.

---

## Implementation details

### Database schema

**Migration:** `20250624140000_production_infrastructure.sql`

**Table: `queue_jobs`**

| Column | Purpose |
|--------|---------|
| `queue_name` | Named queue (8 supported) |
| `job_type` | Handler discriminator string |
| `payload` | JSONB job data |
| `status` | `pending` · `running` · `completed` · `failed` · `cancelled` · `paused` |
| `priority` | Higher processed first |
| `attempts` / `max_attempts` | Retry tracking (default max 5) |
| `scheduled_at` | Delayed execution and retry scheduling |
| `idempotency_key` | Prevents duplicate active jobs |

**Table: `queue_dead_letters`**

Preserves failed jobs after exhaustion: full payload, error message, attempt count, timestamp.

**Indexes:**

- `idx_queue_jobs_queue_status_scheduled` — pending/paused pickup
- `idx_queue_jobs_idempotency` — unique (queue_name, idempotency_key) for active jobs

**Trigger:** `queue_jobs_set_updated_at` on UPDATE.

### Named queues

From `src/lib/jobs/types.ts`:

`emails` · `ai_generation` · `automation_execution` · `connector_sync` · `webhook_delivery` · `predictive_refresh` · `billing_sync` · `reports`

### Code architecture

**Directory:** `src/lib/queue/`

| Module | Responsibility |
|--------|----------------|
| `repository.ts` | Enqueue, claim, complete, pause, resume, cancel, counts |
| `dispatcher.ts` | `dispatchQueueJob` — server-side enqueue API |
| `worker.ts` | `processQueueWorkerJob` — batch processor (limit 25) |
| `retry.ts` | Exponential backoff: base 1s, max 5 min |
| `dead-letter.ts` | `handleQueueJobFailure`, `moveToDeadLetter` |
| `metrics.ts` | Average processing time, retried job count |
| `health.ts` | `getQueueDiagnosticsSnapshot` |

### Claim semantics

`claimNextQueueJob`:

1. Select highest priority, oldest scheduled pending job (optionally filtered by queue)
2. Optimistic update: `pending` → `running`, increment `attempts`
3. Return null if concurrent worker claimed first (safe for multi-instance with DB-level guard)

### Retry and dead letter

`handleQueueJobFailure`:

- If `attempts < maxAttempts`: reset to `pending`, set `scheduled_at` via `nextRetryScheduledAt`
- Else: insert `queue_dead_letters` row, mark job `failed`

Backoff formula: `min(1000 * 2^(attempt-1), 300000)` ms.

### Cron integration

`queue_worker` job in `src/lib/jobs/dispatcher.ts` calls `processQueueWorkerJob(25)` every 5 minutes when due.

---

## Validation steps

### Enqueue test (server context)

Use application code or admin script:

```typescript
import { dispatchQueueJob } from "@/lib/queue/dispatcher";

await dispatchQueueJob({
  queueName: "reports",
  jobType: "test.ping",
  payload: { test: true },
  idempotencyKey: "staging-test-001",
});
```

### Processing test

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "https://<domain>/api/cron/run?job=queue_worker"
```

Verify response metadata: `{ processed, failed, limit }`.

### SQL verification

```sql
SELECT queue_name, status, COUNT(*) FROM queue_jobs GROUP BY 1, 2;

SELECT * FROM queue_dead_letters ORDER BY dead_at DESC LIMIT 10;

SELECT id, queue_name, job_type, attempts, max_attempts, scheduled_at, error_message
FROM queue_jobs WHERE status = 'pending' ORDER BY priority DESC, scheduled_at ASC;
```

### Idempotency test

Enqueue same `queueName` + `idempotencyKey` twice — second call returns null (no duplicate row).

### Diagnostics verification

Settings → Diagnostics → **Queue infrastructure**:

| Field | Healthy expectation |
|-------|---------------------|
| Tables reachable | true |
| Jobs pending | Low under normal load |
| Jobs failed | 0–10 |
| Dead letters | 0–5 |
| Status | `healthy` |

Per-queue breakdown shows pending/running/failed/paused per named queue.

### Health thresholds (code)

From `src/lib/queue/health.ts`:

- `degraded`: failed > 10 OR dead letters > 5
- `unavailable`: failed > 50 OR pending > 500

---

## Pilot readiness notes

| Criterion | Status |
|-----------|--------|
| Durable job storage | ✅ |
| Atomic claim | ✅ Optimistic pending→running |
| Exponential retry | ✅ |
| Dead letter audit | ✅ |
| Idempotency keys | ✅ |
| Cron-driven worker | ✅ Every 5 minutes |
| Per-queue diagnostics | ✅ 8 queues |
| Job handler implementations | ⚠️ Stubs for some job types |

**Production readiness contribution:** Queue readiness sub-score (base 88, −15 degraded, 40 if tables unreachable).

**Operational requirements:**

- Monitor dead letters weekly
- Ensure `queue_worker` cron runs at least every 5 minutes
- Replay dead letters via [operations-runbook.md](./operations-runbook.md)

**Recommendation:** Approved for pilot infrastructure. Enqueue producers should use idempotency keys for user-triggered actions. Complete handler implementations for `predictive.refresh` and `connector.sync` before relying on queue for those workloads.
