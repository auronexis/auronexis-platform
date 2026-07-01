import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { SlaComplianceMetrics, SlaMonthlyTrendPoint } from "@/lib/sla/types";

const MS_PER_MINUTE = 60_000;

type SlaEventMetricRow = {
  breached: boolean;
  responded_at: string | null;
  resolved_at: string | null;
  started_at: string | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  status: string;
  created_at: string;
};

function averageMinutes(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function monthKey(value: string): string {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function loadSlaEventRows(organizationId: string): Promise<SlaEventMetricRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_events")
      .select(
        "breached, responded_at, resolved_at, started_at, response_due_at, resolution_due_at, status, created_at",
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.warn("[sla] loadSlaEventRows failed:", error.message);
      return [];
    }

    return (data ?? []) as SlaEventMetricRow[];
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

export function getComplianceRate(rows: SlaEventMetricRow[]): number {
  if (rows.length === 0) {
    return 100;
  }

  const completed = rows.filter((row) => row.resolved_at || row.status === "completed");
  if (completed.length === 0) {
    const activeBreaches = rows.filter((row) => row.breached).length;
    return activeBreaches === 0 ? 100 : Math.max(0, 100 - Math.round((activeBreaches / rows.length) * 100));
  }

  const compliant = completed.filter((row) => !row.breached).length;
  return Math.round((compliant / completed.length) * 100);
}

export function computeSlaMetrics(rows: SlaEventMetricRow[]): SlaComplianceMetrics {
  const breachedCount = rows.filter((row) => row.breached).length;
  const openTimers = rows.filter(
    (row) => !row.resolved_at && row.status !== "completed" && row.status !== "resolved",
  ).length;

  const responseDurations: number[] = [];
  const resolutionDurations: number[] = [];

  for (const row of rows) {
    if (row.started_at && row.responded_at) {
      responseDurations.push(
        (new Date(row.responded_at).getTime() - new Date(row.started_at).getTime()) / MS_PER_MINUTE,
      );
    }

    if (row.started_at && row.resolved_at) {
      resolutionDurations.push(
        (new Date(row.resolved_at).getTime() - new Date(row.started_at).getTime()) / MS_PER_MINUTE,
      );
    }
  }

  const monthlyMap = new Map<string, { total: number; compliant: number }>();
  for (const row of rows) {
    const key = monthKey(row.created_at);
    const bucket = monthlyMap.get(key) ?? { total: 0, compliant: 0 };
    bucket.total += 1;
    if (!row.breached) {
      bucket.compliant += 1;
    }
    monthlyMap.set(key, bucket);
  }

  const monthlyTrend: SlaMonthlyTrendPoint[] = [...monthlyMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, bucket]) => ({
      month,
      compliancePercent: bucket.total > 0 ? Math.round((bucket.compliant / bucket.total) * 100) : 100,
    }));

  return {
    breachedCount,
    compliancePercent: getComplianceRate(rows),
    avgResponseMinutes: averageMinutes(responseDurations),
    avgResolutionMinutes: averageMinutes(resolutionDurations),
    criticalBreaches: breachedCount,
    openTimers,
    monthlyTrend,
  };
}
