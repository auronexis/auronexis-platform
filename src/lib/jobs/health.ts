import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CronDiagnosticsSnapshot,
  JobExecutionStatus,
  JobHealthStatus,
  JobId,
} from "@/lib/jobs/types";
import { JOB_REGISTRY } from "@/lib/jobs/registry";
import { countPendingQueueJobs } from "@/lib/queue/repository";

export async function getCronDiagnosticsSnapshot(): Promise<CronDiagnosticsSnapshot> {
  const admin = createAdminClient();

  const tableProbe = await admin.from("job_definitions").select("id", { count: "exact", head: true });
  if (tableProbe.error) {
    return {
      tableReachable: false,
      registeredJobs: 0,
      enabledJobs: 0,
      failedJobsLast24h: 0,
      averageDurationMs: null,
      nextRunAt: null,
      lastRunAt: null,
      queueBacklog: 0,
      status: "unavailable",
      jobs: [],
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [definitions, schedules, failedRecent, durations, queueBacklog] = await Promise.all([
    admin.from("job_definitions").select("id, name, enabled, schedule_cron"),
    admin.from("job_schedules").select("job_id, next_run_at, last_run_at"),
    admin
      .from("job_executions")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("started_at", since),
    admin
      .from("job_executions")
      .select("duration_ms")
      .eq("status", "completed")
      .gte("started_at", since)
      .limit(100),
    countPendingQueueJobs(),
  ]);

  const scheduleMap = new Map(
    ((schedules.data ?? []) as Array<{ job_id: string; next_run_at: string; last_run_at: string | null }>).map(
      (row) => [row.job_id, row],
    ),
  );

  const durationRows = (durations.data ?? []) as Array<{ duration_ms: number | null }>;
  const averageDurationMs =
    durationRows.length > 0
      ? Math.round(
          durationRows.reduce((sum, row) => sum + (row.duration_ms ?? 0), 0) / durationRows.length,
        )
      : null;

  const jobs = await Promise.all(
    JOB_REGISTRY.map(async (job) => {
      const schedule = scheduleMap.get(job.id);
      const { data: lastExec } = await admin
        .from("job_executions")
        .select("status")
        .eq("job_id", job.id)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: failedCount } = await admin
        .from("job_executions")
        .select("id", { count: "exact", head: true })
        .eq("job_id", job.id)
        .eq("status", "failed")
        .gte("started_at", since);

      return {
        id: job.id as JobId,
        name: job.name,
        enabled: job.enabled,
        scheduleCron: job.scheduleCron,
        nextRunAt: schedule?.next_run_at ?? null,
        lastRunAt: schedule?.last_run_at ?? null,
        lastStatus: ((lastExec as { status?: JobExecutionStatus } | null)?.status ?? null) as JobExecutionStatus | null,
        failedCount24h: failedCount ?? 0,
      };
    }),
  );

  const enabledJobs = ((definitions.data ?? []) as Array<{ enabled: boolean }>).filter(
    (row) => row.enabled,
  ).length;

  const nextRuns = jobs
    .map((job) => job.nextRunAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const lastRuns = jobs
    .map((job) => job.lastRunAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse();

  const failedJobsLast24h = failedRecent.count ?? 0;
  let status: JobHealthStatus = "healthy";
  if (failedJobsLast24h > 5) {
    status = "degraded";
  }
  if (failedJobsLast24h > 20) {
    status = "unavailable";
  }

  return {
    tableReachable: true,
    registeredJobs: JOB_REGISTRY.length,
    enabledJobs,
    failedJobsLast24h,
    averageDurationMs,
    nextRunAt: nextRuns[0] ?? null,
    lastRunAt: lastRuns[0] ?? null,
    queueBacklog,
    status,
    jobs,
  };
}
