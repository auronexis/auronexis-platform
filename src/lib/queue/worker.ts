import "server-only";

import type { QueueJob } from "@/lib/jobs/types";
import { handleQueueJobFailure } from "@/lib/queue/dead-letter";
import { claimNextQueueJob, completeQueueJob } from "@/lib/queue/repository";

async function processQueueJob(job: QueueJob): Promise<void> {
  switch (job.jobType) {
    case "predictive.refresh":
      break;
    case "connector.sync":
      break;
    default:
      break;
  }
}

/** Process up to N pending queue jobs (invoked by cron queue_worker job). */
export async function processQueueWorkerJob(limit = 25): Promise<Record<string, unknown>> {
  let processed = 0;
  let failed = 0;

  for (let index = 0; index < limit; index += 1) {
    const job = await claimNextQueueJob();
    if (!job) {
      break;
    }

    try {
      await processQueueJob(job);
      await completeQueueJob(job.id, "completed");
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Queue job failed.";
      await handleQueueJobFailure(job, message);
      failed += 1;
    }
  }

  return { processed, failed, limit };
}
