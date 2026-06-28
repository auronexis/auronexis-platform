import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

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

  return { staleExecutions: count ?? 0, pruned: false, note: "Count-only maintenance pass" };
}
