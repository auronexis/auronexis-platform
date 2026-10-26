import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { SlaComplianceMetrics } from "@/lib/sla/types";
import { computeSlaMetrics, type SlaEventMetricRow } from "@/lib/sla/metrics-compute";

export { computeSlaMetrics, getComplianceRate } from "@/lib/sla/metrics-compute";

type SlaEventQueryRow = Omit<SlaEventMetricRow, "severity"> & {
  incidents?: { severity: string | null } | Array<{ severity: string | null }> | null;
};

function incidentSeverity(row: SlaEventQueryRow): string | null {
  const incident = Array.isArray(row.incidents) ? row.incidents[0] : row.incidents;
  return incident?.severity ?? null;
}

async function loadSlaEventRows(organizationId: string): Promise<SlaEventMetricRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_events")
      .select(
        "breached, responded_at, resolved_at, started_at, response_due_at, resolution_due_at, status, created_at, incidents(severity)",
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.warn("[sla] loadSlaEventRows failed:", error.message);
      return [];
    }

    return ((data ?? []) as SlaEventQueryRow[]).map(({ incidents: _incidents, ...row }) => ({
      ...row,
      severity: incidentSeverity({ ...row, incidents: _incidents }),
    }));
  } catch (error) {
    console.warn("[sla] loadSlaEventRows failed:", error);
    return [];
  }
}

/** Organization SLA KPIs derived from persisted SLA events. */
export async function getSLAMetrics(session: SessionContext): Promise<SlaComplianceMetrics> {
  const rows = await loadSlaEventRows(session.organization.id);
  return computeSlaMetrics(rows);
}

