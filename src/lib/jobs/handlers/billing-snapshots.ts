import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Record usage snapshot placeholders for active subscriptions. */
export async function processBillingSnapshotsJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const periodStart = new Date();
  periodStart.setUTCDate(1);
  periodStart.setUTCHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
  periodEnd.setUTCDate(0);
  periodEnd.setUTCHours(23, 59, 59, 999);

  const { data: subscriptions, error } = await admin
    .from("organization_subscriptions")
    .select("organization_id, status")
    .in("status", ["active", "trialing"]);

  if (error) {
    throw new Error(error.message);
  }

  let upserted = 0;

  for (const row of (subscriptions ?? []) as Array<{ organization_id: string }>) {
    const { error: upsertError } = await admin.from("subscription_usage_snapshots").upsert(
      {
        organization_id: row.organization_id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        metrics: {},
      } as never,
      { onConflict: "organization_id,period_start" },
    );

    if (!upsertError) {
      upserted += 1;
    }
  }

  return { upserted, subscriptionCount: subscriptions?.length ?? 0 };
}
