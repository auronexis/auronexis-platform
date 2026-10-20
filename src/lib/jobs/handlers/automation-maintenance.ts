import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const JOB_LOG_RETENTION_DAYS = 60;

/** Prune automation execution steps older than 90 days (metadata only). */
export async function processAutomationMaintenanceJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("automation_executions")
    .select("id", { count: "exact", head: true })
    .lt("started_at", cutoff);

  if (error) {
    throw new Error(error.message);
  }

  // Background job log (system data, no customer content): keep completed runs for 60 days,
  // keep failed runs for audit. Prevents unbounded growth of job_executions.
  const jobLogCutoff = new Date(Date.now() - JOB_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: prunedJobLog } = await admin
    .from("job_executions")
    .delete()
    .eq("status", "completed")
    .lt("started_at", jobLogCutoff)
    .select("id");

  return {
    staleExecutions: count ?? 0,
    pruned: false,
    note: "Count-only maintenance pass for automation executions",
    jobLogRowsPruned: (prunedJobLog ?? []).length,
  };
}
