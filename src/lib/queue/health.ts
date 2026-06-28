import "server-only";

import type { QueueDiagnosticsSnapshot, QueueName, JobHealthStatus } from "@/lib/jobs/types";
import { countDeadLetters } from "@/lib/queue/dead-letter";
import { countRetriedQueueJobs, getAverageQueueProcessingTimeMs } from "@/lib/queue/metrics";
import { countPendingQueueJobs, countQueueJobsByStatus } from "@/lib/queue/repository";
import { createAdminClient } from "@/lib/supabase/admin";

const QUEUE_NAMES: QueueName[] = [
  "emails",
  "ai_generation",
  "automation_execution",
  "connector_sync",
  "webhook_delivery",
  "predictive_refresh",
  "billing_sync",
  "reports",
];

export async function getQueueDiagnosticsSnapshot(): Promise<QueueDiagnosticsSnapshot> {
  const admin = createAdminClient();
  const tableProbe = await admin.from("queue_jobs").select("id", { count: "exact", head: true });

  if (tableProbe.error) {
    return {
      tableReachable: false,
      jobsPending: 0,
      jobsRunning: 0,
      jobsFailed: 0,
      jobsRetried: 0,
      deadLetters: 0,
      averageProcessingTimeMs: null,
      status: "unavailable",
      queues: [],
    };
  }

  const [pending, running, failed, retried, deadLetters, averageProcessingTimeMs, queues] =
    await Promise.all([
      countPendingQueueJobs(),
      countQueueJobsByStatus("running"),
      countQueueJobsByStatus("failed"),
      countRetriedQueueJobs(),
      countDeadLetters(),
      getAverageQueueProcessingTimeMs(),
      Promise.all(
        QUEUE_NAMES.map(async (name) => ({
          name,
          pending: await countQueueJobsByStatus("pending", name),
          running: await countQueueJobsByStatus("running", name),
          failed: await countQueueJobsByStatus("failed", name),
          paused: await countQueueJobsByStatus("paused", name),
        })),
      ),
    ]);

  let status: JobHealthStatus = "healthy";
  if (failed > 10 || deadLetters > 5) {
    status = "degraded";
  }
  if (failed > 50 || pending > 500) {
    status = "unavailable";
  }

  return {
    tableReachable: true,
    jobsPending: pending,
    jobsRunning: running,
    jobsFailed: failed,
    jobsRetried: retried,
    deadLetters,
    averageProcessingTimeMs,
    status,
    queues,
  };
}
