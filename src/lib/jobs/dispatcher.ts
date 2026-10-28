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
  isScheduleDue,
  listJobSchedules,
} from "@/lib/jobs/scheduler";
import type { JobId, JobRunResult } from "@/lib/jobs/types";
import { processWebhookDeliveryRetries } from "@/lib/jobs/handlers/webhook-retries";
import { processQueueWorkerJob } from "@/lib/queue/worker";
import { hasDueWebhookDeliveries } from "@/lib/webhooks/queries";
import { hasPendingQueueJobs } from "@/lib/queue/repository";

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

/**
 * Polling jobs run every tick but usually have nothing to do. A cheap "is there work?" check
 * lets an idle tick skip them without writing execution rows or touching the schedule.
 */
const IDLE_PRECHECKS: Partial<Record<JobId, () => Promise<boolean>>> = {
  webhook_retries: hasDueWebhookDeliveries,
  queue_worker: hasPendingQueueJobs,
};

/** Run a registered cron job with execution history and schedule advancement. */
export async function dispatchJob(
  jobId: JobId,
  options?: { force?: boolean; knownDue?: boolean },
): Promise<JobRunResult> {
  const definition = getJobDefinition(jobId);

  if (!definition?.enabled) {
    return { jobId, status: "skipped", durationMs: 0, metadata: { reason: "disabled" } };
  }

  if (!options?.force && !options?.knownDue && !(await isJobDue(jobId))) {
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
  const handler = JOB_HANDLERS[jobId];

  let executionId: string;
  try {
    executionId = await createJobExecution(jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create job execution.";
    return { jobId, status: "failed", durationMs: Date.now() - started, errorMessage: message };
  }

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

/** Run all due registered jobs sequentially. Schedules are read once per tick. */
export async function dispatchDueJobs(): Promise<JobRunResult[]> {
  const jobIds = Object.keys(JOB_HANDLERS) as JobId[];
  const results: JobRunResult[] = [];
  const schedules = await listJobSchedules();

  for (const jobId of jobIds) {
    try {
      const due = schedules ? isScheduleDue(schedules.get(jobId)) : await isJobDue(jobId);
      if (!due) {
        continue;
      }

      const precheck = IDLE_PRECHECKS[jobId];
      if (precheck && !(await precheck())) {
        results.push({ jobId, status: "skipped", durationMs: 0, metadata: { reason: "no_work" } });
        continue;
      }

      results.push(await dispatchJob(jobId, { knownDue: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Job dispatch failed.";
      results.push({ jobId, status: "failed", durationMs: 0, errorMessage: message });
    }
  }

  return results;
}
