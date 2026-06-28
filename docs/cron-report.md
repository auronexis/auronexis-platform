# Cron Infrastructure Report — Phase 5 Sprint 0

**Date:** 2025-06-27  
**Sprint:** Phase 5 Sprint 0 — Production Infrastructure  
**Target:** v0.95 Pilot / Production Infrastructure Ready

---

## Summary

Auroranexis now runs scheduled background work through a database-backed cron system: job definitions and schedules in Supabase, execution history for audit, a code registry mapping jobs to handlers, and an authenticated HTTP dispatcher at `/api/cron/run`. Eight jobs cover reports, SLA, connectors, billing, predictive intelligence, automation maintenance, retention simulation, and queue processing.

**Status:** Implemented. External scheduler required for production (same gap as v0.9, now with first-class infrastructure).

---

## Implementation details

### Database schema

**Migration:** `20250624140000_production_infrastructure.sql`

| Table | Purpose |
|-------|---------|
| `job_definitions` | Static job metadata (id, name, cron expression, enabled) |
| `job_schedules` | Per-job `next_run_at`, `last_run_at`, optional lock fields |
| `job_executions` | Run history: status, duration, error, metadata JSON |

**Seeded jobs (8):**

| ID | Cron | Description |
|----|------|-------------|
| `report_schedules` | `0 * * * *` | Generate draft reports for due schedules |
| `sla_alerts` | `*/15 * * * *` | Evaluate SLA breaches and dispatch alerts |
| `connector_sync` | `0 */6 * * *` | Scheduled connector synchronizations |
| `billing_snapshots` | `0 2 * * *` | Subscription usage snapshots |
| `predictive_refresh` | `0 3 * * *` | Refresh predictive forecasts |
| `automation_maintenance` | `0 4 * * 0` | Prune stale automation metadata |
| `retention_cleanup` | `0 5 1 * *` | Retention impact simulation (no auto-delete) |
| `queue_worker` | `*/5 * * * *` | Process background queue jobs |

### Code architecture

**Directory:** `src/lib/jobs/`

| Module | Responsibility |
|--------|----------------|
| `registry.ts` | `JOB_REGISTRY` — canonical job list (mirrors DB seed) |
| `scheduler.ts` | Due checks, schedule advancement, execution CRUD |
| `dispatcher.ts` | `dispatchJob`, `dispatchDueJobs` — orchestration |
| `health.ts` | `getCronDiagnosticsSnapshot` for diagnostics |
| `handlers/*.ts` | Per-job business logic |

**Schedule advancement:** Uses `DEFAULT_INTERVAL_MS` per job ID (not cron parser at runtime). Intervals align with seeded cron expressions.

**Dispatcher flow:**

1. Check job enabled and due (unless `force: true`)
2. Insert `job_executions` row with `status = 'running'`
3. Execute handler from `JOB_HANDLERS` map
4. Complete execution (`completed` or `failed`) with duration and metadata
5. Advance `job_schedules.next_run_at` regardless of outcome

### HTTP endpoint

**File:** `src/app/api/cron/run/route.ts`

| Method | Behavior |
|--------|----------|
| `POST` | Dispatch all due jobs, or single job when `?job=<id>` |
| `GET` | Health probe — returns registered job IDs without execution |

**Auth:** `verifyCronAuthorization` — `Authorization: Bearer <CRON_SECRET>`. Development bypass when secret unset.

**Env:** `CRON_SECRET` via `src/lib/env.ts`

### Handlers

| Handler file | Job ID |
|--------------|--------|
| `handlers/report-schedules.ts` | `report_schedules` |
| `handlers/sla-alerts.ts` | `sla_alerts` |
| `handlers/connector-sync.ts` | `connector_sync` |
| `handlers/billing-snapshots.ts` | `billing_snapshots` |
| `handlers/predictive-refresh.ts` | `predictive_refresh` |
| `handlers/automation-maintenance.ts` | `automation_maintenance` |
| `handlers/retention-cleanup.ts` | `retention_cleanup` |
| `../queue/worker.ts` | `queue_worker` |

---

## Validation steps

### Endpoint tests

```bash
# Health probe
curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/run

# Dispatch all due jobs
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/run

# Force single job
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "https://<domain>/api/cron/run?job=report_schedules"
```

Expected: `{ ok: true, results: [...] }` with per-job status, duration, metadata.

### Database verification

```sql
SELECT jd.id, jd.enabled, js.next_run_at, js.last_run_at
FROM job_definitions jd
LEFT JOIN job_schedules js ON js.job_id = jd.id;

SELECT job_id, status, duration_ms, error_message, started_at
FROM job_executions
ORDER BY started_at DESC LIMIT 20;
```

### Diagnostics verification

Settings → Diagnostics → **Cron infrastructure**:

| Field | Healthy expectation |
|-------|---------------------|
| Tables reachable | true |
| Registered jobs | 8 |
| Enabled jobs | 8 |
| Failed jobs (24h) | 0–5 |
| Status | `healthy` |
| Queue backlog | Low (ties to queue worker) |

Per-job list shows name, enabled state, and last status.

### Health thresholds (code)

From `src/lib/jobs/health.ts`:

- `healthy`: failed jobs last 24h ≤ 5
- `degraded`: failed jobs last 24h > 5
- `unavailable`: failed jobs last 24h > 20

---

## Pilot readiness notes

| Criterion | Status |
|-----------|--------|
| Durable execution history | ✅ `job_executions` |
| Schedule persistence | ✅ `job_schedules` |
| Authenticated dispatch | ✅ `CRON_SECRET` bearer |
| Force-run for incidents | ✅ `?job=` parameter |
| Diagnostics integration | ✅ Cron infrastructure section |
| External scheduler | ⚠️ Operator must configure (every 5 min minimum) |
| Distributed locking | ⚠️ `locked_until` / `lock_token` columns exist but not used in dispatcher yet |

**Production readiness contribution:** Cron readiness sub-score (base 90, −15 degraded, 40 if tables unreachable).

**Closes v0.9 gap:** "No database cron for schedules/SLA/sync" — infrastructure now present; operational wiring is checklist item.

**Recommendation:** Approved for pilot with external cron scheduler configured per [production-checklist.md](./production-checklist.md). SLA guarantees require scheduler uptime monitoring.
