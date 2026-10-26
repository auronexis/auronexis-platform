import type { SlaComplianceMetrics, SlaMonthlyTrendPoint } from "@/lib/sla/types";

const MS_PER_MINUTE = 60_000;

export type SlaEventMetricRow = {
  breached: boolean;
  responded_at: string | null;
  resolved_at: string | null;
  started_at: string | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  status: string;
  created_at: string;
  /** Severity of the linked incident, when the event belongs to an incident. */
  severity?: string | null;
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

/**
 * Share of SLA events (running and completed) that have not breached.
 * Active breaches count too — a running timer that is already past its target is not compliant.
 */
export function getComplianceRate(rows: SlaEventMetricRow[]): number {
  if (rows.length === 0) {
    return 100;
  }

  const compliant = rows.filter((row) => !row.breached).length;
  return Math.round((compliant / rows.length) * 100);
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
    criticalBreaches: rows.filter((row) => row.breached && row.severity === "critical").length,
    openTimers,
    monthlyTrend,
  };
}
