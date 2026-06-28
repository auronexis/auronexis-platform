import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getAverageQueueProcessingTimeMs(): Promise<number | null> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("queue_jobs")
    .select("started_at, completed_at")
    .eq("status", "completed")
    .gte("completed_at", since)
    .limit(100);

  if (error || !data?.length) {
    return null;
  }

  const durations = (data as Array<{ started_at: string | null; completed_at: string | null }>)
    .map((row) => {
      if (!row.started_at || !row.completed_at) {
        return null;
      }
      return new Date(row.completed_at).getTime() - new Date(row.started_at).getTime();
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) {
    return null;
  }

  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

export async function countRetriedQueueJobs(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("queue_jobs")
    .select("id", { count: "exact", head: true })
    .gt("attempts", 1);
  return count ?? 0;
}
