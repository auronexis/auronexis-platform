import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { JobId } from "@/lib/jobs/types";
import { dispatchDueJobs, dispatchJob } from "@/lib/jobs/dispatcher";
import { listRegisteredJobIds } from "@/lib/jobs/registry";

export type CronActionState = {
  error?: string;
  success?: string;
};

/** Server action — run a single cron job (owner/admin diagnostics only). */
export async function runCronJobAction(jobId: JobId): Promise<CronActionState> {
  try {
    const result = await dispatchJob(jobId, { force: true });
    if (result.status === "failed") {
      return { error: result.errorMessage ?? "Job failed." };
    }
    return { success: `Job ${jobId} ${result.status}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to run job." };
  }
}

/** Server action — run all due cron jobs. */
export async function runDueCronJobsAction(): Promise<CronActionState> {
  try {
    const results = await dispatchDueJobs();
    const completed = results.filter((result) => result.status === "completed").length;
    return { success: `Ran ${results.length} job(s); ${completed} completed.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to run due jobs." };
  }
}

export async function countJobExecutions(jobId?: JobId): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from("job_executions").select("id", { count: "exact", head: true });
  if (jobId) {
    query = query.eq("job_id", jobId);
  }
  const { count } = await query;
  return count ?? 0;
}

export function listCronJobIdsForDiagnostics(): JobId[] {
  return listRegisteredJobIds();
}
