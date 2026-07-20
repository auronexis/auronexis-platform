import "server-only";

import { processDueReportSchedules } from "@/lib/jobs/handlers/report-schedules";
import { processSlaAlertsJob } from "@/lib/jobs/handlers/sla-alerts";
import { processConnectorSyncJob } from "@/lib/jobs/handlers/connector-sync";
import { processBillingSnapshotsJob } from "@/lib/jobs/handlers/billing-snapshots";
import { processPredictiveRefreshJob } from "@/lib/jobs/handlers/predictive-refresh";
import { processAutomationMaintenanceJob } from "@/lib/jobs/handlers/automation-maintenance";
import { processRetentionCleanupJob } from "@/lib/jobs/handlers/retention-cleanup";
import { getJobDefinition } from "@/lib/jobs/registry";
import {
  advanceJobSchedule,
  completeJobExecution,
  createJobExecution,
  hasRunningJobExecution,
  isJobDue,
} from "@/lib/jobs/scheduler";
import type { JobId, JobRunResult } from "@/lib/jobs/types";
import { processWebhookDeliveryRetries } from "@/lib/jobs/handlers/webhook-retries";
import { processQueueWorkerJob } from "@/lib/queue/worker";

type JobHandler = () => Promise<Record<string, unknown>>;

const JOB_HANDLERS: Record<JobId, JobHandler> = {
  report_schedules: processDueReportSchedules,
  sla_alerts: processSlaAlertsJob,
  connector_sync: processConnectorSyncJob,
  billing_snapshots: processBillingSnapshotsJob,
  predictive_refresh: processPredictiveRefreshJob,
  automation_maintenance: processAutomationMaintenanceJob,
  retention_cleanup: processRetentionCleanupJob,
  webhook_retries: processWebhookDeliveryRetries,
  queue_worker: processQueueWorkerJob,
};

/** Run a registered cron job with execution history and schedule advancement. */
export async function dispatchJob(jobId: JobId, options?: { force?: boolean }): Promise<JobRunResult> {
  const definition = getJobDefinition(jobId);

  if (!definition?.enabled) {
    return { jobId, status: "skipped", durationMs: 0, metadata: { reason: "disabled" } };
  }

  if (!options?.force && !(await isJobDue(jobId))) {
    return { jobId, status: "skipped", durationMs: 0, metadata: { reason: "not_due" } };
  }

  if (!options?.force && (await hasRunningJobExecution(jobId))) {
    return {
      jobId,
      status: "skipped",
      durationMs: 0,
      metadata: { reason: "already_running" },
    };
  }

  const started = Date.now();
  const executionId = await createJobExecution(jobId);
  const handler = JOB_HANDLERS[jobId];

  try {
    const metadata = await handler();
    const durationMs = Date.now() - started;
    await completeJobExecution(executionId, { status: "completed", durationMs, metadata });
    await advanceJobSchedule(jobId);
    return { jobId, status: "completed", durationMs, metadata };
  } catch (error) {
    const durationMs = Date.now() - started;
    const message = error instanceof Error ? error.message : "Job failed.";
    await completeJobExecution(executionId, {
      status: "failed",
      durationMs,
      errorMessage: message,
    });
    await advanceJobSchedule(jobId);
    return { jobId, status: "failed", durationMs, errorMessage: message };
  }
}

/** Run all due registered jobs sequentially. */
export async function dispatchDueJobs(): Promise<JobRunResult[]> {
  const jobIds = Object.keys(JOB_HANDLERS) as JobId[];
  const results: JobRunResult[] = [];

  for (const jobId of jobIds) {
    const due = await isJobDue(jobId);
    if (due) {
      results.push(await dispatchJob(jobId));
    }
  }

  return results;
}
