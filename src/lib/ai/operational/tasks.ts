import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OperationalTasksResult, OperationalTaskItem } from "@/lib/ai/operational/types";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import type { SessionContext } from "@/lib/tenancy/context";

/** Build dashboard operational task highlights from verified DB data. */
export async function buildOperationalTasks(
  session: SessionContext,
): Promise<OperationalTasksResult> {
  const supabase = await createClient();
  const orgId = session.organization.id;
  const tasks: OperationalTaskItem[] = [];

  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, title, severity, assigned_user_id, description, status")
    .eq("organization_id", orgId)
    .in("status", OPEN_INCIDENT_STATUSES);

  const { data: risks } = await supabase
    .from("risks")
    .select("id, title, severity, resolution_notes, due_date, status")
    .eq("organization_id", orgId)
    .in("status", OPEN_RISK_STATUSES);

  const openIncidents = incidents ?? [];
  const openRisks = risks ?? [];

  const needsInvestigation = openIncidents.filter(
    (row) => !(row as { description: string | null }).description?.trim(),
  );
  if (needsInvestigation.length > 0) {
    tasks.push({
      id: "incidents-investigation",
      message: `${needsInvestigation.length} incident${needsInvestigation.length === 1 ? "" : "s"} require investigation.`,
      href: "/incidents",
      priority: "high",
    });
  }

  const noMitigation = openRisks.filter(
    (row) => !(row as { resolution_notes: string | null }).resolution_notes?.trim(),
  );
  if (noMitigation.length > 0) {
    tasks.push({
      id: "risks-mitigation",
      message: `${noMitigation.length} risk${noMitigation.length === 1 ? "" : "s"} have no mitigation.`,
      href: "/risks",
      priority: "medium",
    });
  }

  const criticalUnassigned = openIncidents.filter(
    (row) =>
      (row as { severity: string }).severity === "critical" &&
      !(row as { assigned_user_id: string | null }).assigned_user_id,
  );
  if (criticalUnassigned.length > 0) {
    const first = criticalUnassigned[0] as { id: string };
    tasks.push({
      id: "critical-incident",
      message: "1 critical incident needs customer update.",
      href: `/incidents/${first.id}`,
      priority: "critical",
    });
  }

  return {
    tasks: tasks.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}
