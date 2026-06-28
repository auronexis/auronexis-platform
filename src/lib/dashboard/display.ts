import type { ClientHealthCounts } from "@/lib/profitability/types";
import type { CriticalAlertItem } from "@/lib/dashboard/types";
import type { SlaDashboardMetrics } from "@/lib/sla/types";

/** Visual-only health score derived from existing client health counts. */
export function computeHealthScore(clientHealth: ClientHealthCounts): number {
  if (clientHealth.totalClients === 0) {
    return 100;
  }

  const weighted =
    clientHealth.healthyClients * 100 +
    clientHealth.watchClients * 65 +
    clientHealth.criticalClients * 25;

  return Math.max(0, Math.min(100, Math.round(weighted / clientHealth.totalClients)));
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

type ActiveAlertInput = {
  criticalAlerts: CriticalAlertItem[];
  openRiskCount: number;
  openIncidentCount: number;
  slaMetrics: SlaDashboardMetrics;
  includeRisks: boolean;
  includeIncidents: boolean;
  includeSla: boolean;
};

/** Visual-only active alert count from existing dashboard metrics. */
export function countActiveAlerts({
  criticalAlerts,
  openRiskCount,
  openIncidentCount,
  slaMetrics,
  includeRisks,
  includeIncidents,
  includeSla,
}: ActiveAlertInput): number {
  let count = criticalAlerts.length;

  if (includeSla) {
    count += slaMetrics.breachedCount + slaMetrics.warningCount;
  }

  if (includeRisks) {
    count += openRiskCount;
  }

  if (includeIncidents) {
    count += openIncidentCount;
  }

  return count;
}
