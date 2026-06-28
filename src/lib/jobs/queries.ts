import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { JobExecution, JobId } from "@/lib/jobs/types";

export async function listJobExecutionsForDiagnostics(
  organizationId: string,
  limit = 10,
): Promise<JobExecution[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_executions")
    .select("id, job_id, organization_id, status, started_at, completed_at, duration_ms, error_message")
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    jobId: row.job_id as JobId,
    organizationId: (row.organization_id as string | null) ?? null,
    status: row.status as JobExecution["status"],
    startedAt: row.started_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    durationMs: (row.duration_ms as number | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
  }));
}
