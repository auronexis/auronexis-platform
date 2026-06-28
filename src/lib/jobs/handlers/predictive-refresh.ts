import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Enqueue predictive refresh jobs per organization. */
export async function processPredictiveRefreshJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data: orgs, error } = await admin.from("organizations").select("id");

  if (error) {
    throw new Error(error.message);
  }

  let enqueued = 0;

  for (const org of (orgs ?? []) as Array<{ id: string }>) {
    const { error: queueError } = await admin.from("queue_jobs").insert({
      queue_name: "predictive_refresh",
      organization_id: org.id,
      job_type: "predictive.refresh",
      payload: {},
      idempotency_key: `predictive:${org.id}:${new Date().toISOString().slice(0, 10)}`,
      status: "pending",
    } as never);

    if (!queueError) {
      enqueued += 1;
    }
  }

  return { enqueued, organizationCount: orgs?.length ?? 0 };
}
