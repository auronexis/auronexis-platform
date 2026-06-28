import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { QueueJob } from "@/lib/jobs/types";
import { nextRetryScheduledAt, shouldRetry } from "@/lib/queue/retry";
import { completeQueueJob } from "@/lib/queue/repository";

export async function moveToDeadLetter(job: QueueJob, errorMessage: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("queue_dead_letters").insert({
    queue_job_id: job.id,
    queue_name: job.queueName,
    organization_id: job.organizationId,
    job_type: job.jobType,
    payload: job.payload,
    error_message: errorMessage.slice(0, 500),
    attempts: job.attempts,
  } as never);

  await completeQueueJob(job.id, "failed", errorMessage);
}

export async function handleQueueJobFailure(job: QueueJob, errorMessage: string): Promise<void> {
  if (shouldRetry(job.attempts, job.maxAttempts)) {
    const admin = createAdminClient();
    await admin
      .from("queue_jobs")
      .update({
        status: "pending",
        scheduled_at: nextRetryScheduledAt(job.attempts),
        error_message: errorMessage.slice(0, 500),
        started_at: null,
      } as never)
      .eq("id", job.id);
    return;
  }

  await moveToDeadLetter(job, errorMessage);
}

export async function countDeadLetters(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("queue_dead_letters")
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}
