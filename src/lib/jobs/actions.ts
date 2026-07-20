"use server";

import { requireSession } from "@/lib/auth/session";
import { resolveActionError } from "@/lib/action-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobId } from "@/lib/jobs/types";
import { dispatchDueJobs, dispatchJob } from "@/lib/jobs/dispatcher";
import { listRegisteredJobIds } from "@/lib/jobs/registry";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type CronActionState = {
  error?: string;
  success?: string;
};

async function assertCronDiagnosticsAccess(): Promise<{ error: string } | null> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: "You do not have permission to run cron diagnostics." };
  }
  return null;
}

/**
 * Platform job dispatch is elevated. In production, only `/api/cron/run` with
 * CRON_SECRET may execute jobs — session diagnostics must not force platform work.
 */
function assertCanForceDispatchJobs(): { error: string } | null {
  if (process.env.NODE_ENV === "production") {
    return {
      error: "Manual job dispatch is disabled in production. Use the secured cron endpoint.",
    };
  }
  return null;
}

/** Server action — run a single cron job (owner/admin diagnostics only). */
export async function runCronJobAction(jobId: JobId): Promise<CronActionState> {
  const denied = await assertCronDiagnosticsAccess();
  if (denied) {
    return denied;
  }

  const blocked = assertCanForceDispatchJobs();
  if (blocked) {
    return blocked;
  }

  try {
    const result = await dispatchJob(jobId, { force: true });
    if (result.status === "failed") {
      return { error: result.errorMessage ?? "Job failed." };
    }
    return { success: `Job ${jobId} ${result.status}.` };
  } catch (error) {
    return resolveActionError(error, "Unable to run job.");
  }
}

/** Server action — run all due cron jobs. */
export async function runDueCronJobsAction(): Promise<CronActionState> {
  const denied = await assertCronDiagnosticsAccess();
  if (denied) {
    return denied;
  }

  const blocked = assertCanForceDispatchJobs();
  if (blocked) {
    return blocked;
  }

  try {
    const results = await dispatchDueJobs();
    const completed = results.filter((result) => result.status === "completed").length;
    return { success: `Ran ${results.length} job(s); ${completed} completed.` };
  } catch (error) {
    return resolveActionError(error, "Unable to run due jobs.");
  }
}

export async function countJobExecutions(jobId?: JobId): Promise<number> {
  const denied = await assertCronDiagnosticsAccess();
  if (denied) {
    return 0;
  }

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
