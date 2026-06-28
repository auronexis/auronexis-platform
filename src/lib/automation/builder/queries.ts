import "server-only";

import { createClient } from "@/lib/supabase/server";
import { buildAutomationSuggestions } from "@/lib/automation/builder/suggestions";
import type { AutomationSuggestion } from "@/lib/automation/builder/types";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import type { SessionContext } from "@/lib/tenancy/context";

/** Build data-driven automation suggestions from verified workspace metrics. */
export async function getAutomationSuggestions(
  session: SessionContext,
): Promise<AutomationSuggestion[]> {
  const supabase = await createClient();
  const orgId = session.organization.id;

  const [{ count: criticalRisks }, { count: openIncidents }, { data: clients }] =
    await Promise.all([
      supabase
        .from("risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("severity", "critical")
        .in("status", OPEN_RISK_STATUSES),
      supabase
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .in("status", OPEN_INCIDENT_STATUSES),
      supabase
        .from("clients")
        .select("id, status")
        .eq("organization_id", orgId),
    ]);

  const criticalHealthClients =
    clients?.filter((client) => (client as { status: string }).status === "critical").length ?? 0;

  const { count: draftReports } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "draft");

  return buildAutomationSuggestions({
    openCriticalRisks: criticalRisks ?? 0,
    openIncidents: openIncidents ?? 0,
    overdueReports: 0,
    criticalHealthClients,
    delayedReports: draftReports ?? 0,
  });
}
