import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { QueueJob, QueueJobStatus, QueueName } from "@/lib/jobs/types";

function mapQueueRow(row: Record<string, unknown>): QueueJob {
  return {
    id: row.id as string,
    queueName: row.queue_name as QueueName,
    organizationId: (row.organization_id as string | null) ?? null,
    jobType: row.job_type as string,
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as QueueJobStatus,
    priority: row.priority as number,
    attempts: row.attempts as number,
    maxAttempts: row.max_attempts as number,
    scheduledAt: row.scheduled_at as string,
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    idempotencyKey: (row.idempotency_key as string | null) ?? null,
  };
}

export async function enqueueQueueJob(input: {
  queueName: QueueName;
  jobType: string;
  organizationId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
  priority?: number;
  scheduledAt?: string;
}): Promise<QueueJob | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("queue_jobs")
    .insert({
      queue_name: input.queueName,
      organization_id: input.organizationId ?? null,
      job_type: input.jobType,
      payload: input.payload ?? {},
      idempotency_key: input.idempotencyKey ?? null,
      priority: input.priority ?? 0,
      scheduled_at: input.scheduledAt ?? new Date().toISOString(),
      status: "pending",
    } as never)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return null;
    }
    throw new Error(error.message);
  }

  return mapQueueRow(data as Record<string, unknown>);
}

export async function claimNextQueueJob(queueName?: QueueName): Promise<QueueJob | null> {
  const admin = createAdminClient();
  let query = admin
    .from("queue_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("scheduled_at", { ascending: true })
    .limit(1);

  if (queueName) {
    query = query.eq("queue_name", queueName);
  }

  const { data, error } = await query.maybeSingle();
  if (error || !data) {
    return null;
  }

  const job = mapQueueRow(data as Record<string, unknown>);
  const { data: updated, error: updateError } = await admin
    .from("queue_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    } as never)
    .eq("id", job.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (updateError || !updated) {
    return null;
  }

  return mapQueueRow(updated as Record<string, unknown>);
}

export async function completeQueueJob(
  jobId: string,
  status: "completed" | "failed" | "cancelled",
  errorMessage?: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("queue_jobs")
    .update({
      status,
      completed_at: new Date().toISOString(),
      error_message: errorMessage?.slice(0, 500) ?? null,
    } as never)
    .eq("id", jobId);
}

export async function pauseQueueJob(jobId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("queue_jobs").update({ status: "paused" } as never).eq("id", jobId);
}

export async function resumeQueueJob(jobId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("queue_jobs")
    .update({ status: "pending", scheduled_at: new Date().toISOString() } as never)
    .eq("id", jobId)
    .eq("status", "paused");
}

export async function cancelQueueJob(jobId: string): Promise<void> {
  await completeQueueJob(jobId, "cancelled");
}

export async function countPendingQueueJobs(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("queue_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function countQueueJobsByStatus(
  status: QueueJobStatus,
  queueName?: QueueName,
): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from("queue_jobs").select("id", { count: "exact", head: true }).eq("status", status);
  if (queueName) {
    query = query.eq("queue_name", queueName);
  }
  const { count } = await query;
  return count ?? 0;
}
