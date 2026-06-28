import "server-only";

import type { QueueName } from "@/lib/jobs/types";
import { enqueueQueueJob } from "@/lib/queue/repository";

/** Enqueue a background job (server-only — never expose to client components). */
export async function dispatchQueueJob(input: {
  queueName: QueueName;
  jobType: string;
  organizationId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
}): Promise<boolean> {
  const job = await enqueueQueueJob(input);
  return job !== null;
}
