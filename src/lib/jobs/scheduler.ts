import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { JobExecution, JobId, JobSchedule } from "@/lib/jobs/types";

const DEFAULT_INTERVAL_MS: Record<JobId, number> = {
  report_schedules: 60 * 60 * 1000,
  sla_alerts: 15 * 60 * 1000,
  connector_sync: 6 * 60 * 60 * 1000,
  billing_snapshots: 24 * 60 * 60 * 1000,
  predictive_refresh: 24 * 60 * 60 * 1000,
  automation_maintenance: 7 * 24 * 60 * 60 * 1000,
  retention_cleanup: 30 * 24 * 60 * 60 * 1000,
  webhook_retries: 5 * 60 * 1000,
  queue_worker: 5 * 60 * 1000,
};

export async function getJobSchedule(jobId: JobId): Promise<JobSchedule | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_schedules")
    .select("job_id, next_run_at, last_run_at")
    .eq("job_id", jobId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { job_id: string; next_run_at: string; last_run_at: string | null };
  return {
    jobId: row.job_id as JobId,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
  };
}

export async function isJobDue(jobId: JobId): Promise<boolean> {
  const schedule = await getJobSchedule(jobId);
  if (!schedule) {
    return true;
  }
  return new Date(schedule.nextRunAt).getTime() <= Date.now();
}

/** True when a previous execution for this job is still marked running. */
/**
 * A "running" execution older than this is treated as dead (the serverless
 * invocation was killed before it could record completion). Without this,
 * one timed-out run blocks the job forever — which stopped 7 of 9 jobs from
 * 2026-09-14 until this fix.
 */
export const STALE_RUNNING_EXECUTION_MS = 30 * 60 * 1000;

/** Marks dead "running" executions of a job as failed so they no longer block it. */
export async function failStaleRunningJobExecutions(jobId: JobId, now = new Date()): Promise<number> {
  const admin = createAdminClient();
  const cutoff = new Date(now.getTime() - STALE_RUNNING_EXECUTION_MS).toISOString();
  const { data, error } = await admin
    .from("job_executions")
    .update({
      status: "failed",
      completed_at: now.toISOString(),
      error_message: "Execution timed out (no completion recorded).",
    } as never)
    .eq("job_id", jobId)
    .eq("status", "running")
    .lt("started_at", cutoff)
    .select("id");

  if (error) {
    return 0;
  }
  return (data ?? []).length;
}

/** True only when a job has a live (recent) running execution. Stale runs are failed first. */
export async function hasRunningJobExecution(jobId: JobId): Promise<boolean> {
  await failStaleRunningJobExecutions(jobId);

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - STALE_RUNNING_EXECUTION_MS).toISOString();
  const { data, error } = await admin
    .from("job_executions")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "running")
    .gte("started_at", cutoff)
    .limit(1)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function advanceJobSchedule(jobId: JobId): Promise<void> {
  const admin = createAdminClient();
  const now = new Date();
  const next = new Date(now.getTime() + (DEFAULT_INTERVAL_MS[jobId] ?? 60 * 60 * 1000));

  await admin.from("job_schedules").upsert(
    {
      job_id: jobId,
      last_run_at: now.toISOString(),
      next_run_at: next.toISOString(),
    } as never,
    { onConflict: "job_id" },
  );
}

export async function createJobExecution(
  jobId: JobId,
  organizationId?: string | null,
): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_executions")
    .insert({
      job_id: jobId,
      organization_id: organizationId ?? null,
      status: "running",
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Unable to create job execution for ${jobId}.`);
  }

  return (data as { id: string }).id;
}

export async function completeJobExecution(
  executionId: string,
  input: { status: "completed" | "failed"; durationMs: number; errorMessage?: string; metadata?: Record<string, unknown> },
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("job_executions")
    .update({
      status: input.status,
      completed_at: new Date().toISOString(),
      duration_ms: input.durationMs,
      error_message: input.errorMessage?.slice(0, 500) ?? null,
      metadata: input.metadata ?? {},
    } as never)
    .eq("id", executionId);
}

export async function listRecentJobExecutions(limit = 20): Promise<JobExecution[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_executions")
    .select("id, job_id, organization_id, status, started_at, completed_at, duration_ms, error_message")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    jobId: row.job_id as JobId,
    organizationId: (row.organization_id as string | null) ?? null,
    status: row.status as JobExecution["status"],
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
  }));
}
