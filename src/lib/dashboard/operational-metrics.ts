import type { DashboardData } from "@/lib/dashboard/types";

export type DashboardOperationalMetricDef = {
  key: "clients" | "risks" | "incidents" | "sla";
  label: string;
  value: number;
  trend: string;
  tone: "info" | "warning" | "danger";
};

/**
 * Feature-gated operational metric definitions for the command center.
 * Every label is derived from the workspace's own data — no placeholder trends.
 */
export function resolveDashboardOperationalMetrics(
  data: DashboardData,
): DashboardOperationalMetricDef[] {
  const newClients = data.newClientsThisMonth ?? 0;
  const metrics: DashboardOperationalMetricDef[] = [
    {
      key: "clients",
      label: "Clients",
      value: data.clientHealth.totalClients,
      trend: newClients > 0 ? `+${newClients} this month` : "None added this month",
      tone: "info",
    },
  ];

  if (data.features.risks) {
    metrics.push({
      key: "risks",
      label: "Open risks",
      value: data.openRiskCount,
      trend: data.openRiskCount > 0 ? "Needs attention" : "All clear",
      tone: data.openRiskCount > 0 ? "warning" : "info",
    });
  }

  if (data.features.incidents) {
    metrics.push({
      key: "incidents",
      label: "Open incidents",
      value: data.openIncidentCount,
      trend: data.openIncidentCount > 0 ? "Active queue" : "None open",
      tone: data.openIncidentCount > 0 ? "danger" : "info",
    });
  }

  if (data.features.sla) {
    const breached = data.slaMetrics.breachedCount;
    metrics.push({
      key: "sla",
      label: "Breached SLAs",
      value: breached,
      trend: breached > 0 ? "Compliance watch" : "Within targets",
      tone: breached > 0 ? "danger" : "info",
    });
  }

  return metrics;
}

/** Start of the current calendar month in UTC, as an ISO timestamp. */
export function startOfCurrentMonthUtc(now: Date = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
