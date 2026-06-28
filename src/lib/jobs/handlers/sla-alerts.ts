import "server-only";

import { processOrganizationReportOverdueEscalations } from "@/lib/escalation/evaluations";
import { processOrganizationSlaAlerts } from "@/lib/sla/queries";
import { createAdminClient } from "@/lib/supabase/admin";

/** Evaluate SLA alerts for all organizations. */
export async function processSlaAlertsJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data: orgs, error } = await admin.from("organizations").select("id");

  if (error) {
    throw new Error(error.message);
  }

  let processed = 0;

  for (const org of (orgs ?? []) as Array<{ id: string }>) {
    await processOrganizationSlaAlerts(org.id).catch(() => undefined);
    await processOrganizationReportOverdueEscalations(org.id).catch(() => undefined);
    processed += 1;
  }

  return { organizationsProcessed: processed };
}
