import type { ClientOperationalMetrics } from "@/lib/ai/insights/queries";
import type { HealthDashboardMetrics } from "@/lib/health/types";
import type { ClientHealthCounts } from "@/lib/profitability/types";
import type {
  ClientPriorityResult,
  PortfolioHealthDistribution,
  PrioritySeverity,
} from "@/lib/intelligence/types";

const REPORT_OVERDUE_DAYS = 30;

export function severityFromScore(score: number): PrioritySeverity {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Medium";
  return "Low";
}

function buildRecommendedAction(
  client: ClientOperationalMetrics,
  reasons: string[],
  severity: PrioritySeverity,
): string {
  if (client.criticalIncidents > 0) {
    return "Review open critical incidents and assign ownership today.";
  }

  if (client.criticalRisks > 0) {
    return "Escalate critical risks and confirm mitigation plans.";
  }

  if (
    client.daysSinceLastPublishedReport == null ||
    (client.daysSinceLastPublishedReport != null && client.daysSinceLastPublishedReport > REPORT_OVERDUE_DAYS)
  ) {
    return "Schedule and publish the next client report.";
  }

  if (client.slaBreachesThisPeriod > 0) {
    return "Review SLA breaches and restore compliance commitments.";
  }

  if (client.profitability.health === "critical") {
    return "Review account profitability and delivery scope with leadership.";
  }

  if (client.recentActivityCount === 0) {
    return "Schedule a client check-in to restore engagement.";
  }

  if (severity === "High" || severity === "Critical") {
    return "Open the client workspace and execute the highest-impact follow-up.";
  }

  if (client.openRisks > 0 || client.openIncidents > 0) {
    return "Triage open operational items and update client status.";
  }

  return "Monitor the account and maintain the current delivery cadence.";
}

/** Deterministic client priority score (0–100) from operational metrics. */
export function calculateClientPriority(client: ClientOperationalMetrics): ClientPriorityResult {
  const reasons: string[] = [];
  let score = 0;

  if (client.criticalIncidents > 0) {
    score += client.criticalIncidents * 18;
    reasons.push(`${client.criticalIncidents} critical incident(s)`);
  }

  if (client.criticalRisks > 0) {
    score += client.criticalRisks * 16;
    reasons.push(`${client.criticalRisks} critical risk(s)`);
  }

  if (client.openIncidents > 0) {
    score += client.openIncidents * 6;
    if (client.criticalIncidents === 0) {
      reasons.push(`${client.openIncidents} open incident(s)`);
    }
  }

  if (client.openRisks > 0) {
    score += client.openRisks * 5;
    if (client.criticalRisks === 0) {
      reasons.push(`${client.openRisks} open risk(s)`);
    }
  }

  if (client.slaBreachesThisPeriod > 0) {
    score += client.slaBreachesThisPeriod * 12;
    reasons.push(`${client.slaBreachesThisPeriod} SLA breach(es) this period`);
  }

  if (client.daysSinceLastPublishedReport != null && client.daysSinceLastPublishedReport > REPORT_OVERDUE_DAYS) {
    score += Math.min(20, Math.floor(client.daysSinceLastPublishedReport / 7) * 3);
    reasons.push(`No published report in ${client.daysSinceLastPublishedReport} days`);
  } else if (client.daysSinceLastPublishedReport == null) {
    score += 12;
    reasons.push("No published reports on record");
  }

  if (client.profitability.health === "critical") {
    score += 15;
    reasons.push("Critical profitability health");
  } else if (client.profitability.health === "watch") {
    score += 8;
    reasons.push("Watch profitability health");
  }

  if (client.profitability.margin != null && client.profitability.margin < 20) {
    score += 10;
    reasons.push("Low profitability margin");
  }

  if (client.incidentsThisPeriod > client.incidentsPreviousPeriod) {
    score += 10;
    reasons.push("Incidents increasing this period");
  }

  if (client.recentActivityCount === 0) {
    score += 4;
    reasons.push("No recent activity");
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  const severity = severityFromScore(clampedScore);

  return {
    clientId: client.clientId,
    clientName: client.clientName,
    score: clampedScore,
    severity,
    reasons: reasons.slice(0, 5),
    recommendedAction: buildRecommendedAction(client, reasons, severity),
    healthLabel: client.profitability.health,
    openRisks: client.openRisks,
    openIncidents: client.openIncidents,
    monthlyRevenue: client.profitability.monthlyRevenue,
  };
}

export function rankClientPriorities(clients: ClientOperationalMetrics[]): ClientPriorityResult[] {
  return clients
    .map((client) => calculateClientPriority(client))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.clientName.localeCompare(right.clientName);
    });
}

/** Portfolio distribution from profitability counts and health engine metrics. */
export function buildPortfolioHealthDistribution(
  clientHealth: ClientHealthCounts,
  healthMetrics: HealthDashboardMetrics,
): PortfolioHealthDistribution {
  if (healthMetrics.hasSnapshots && healthMetrics.trackedClients > 0) {
    const healthy =
      healthMetrics.excellentClients + healthMetrics.healthyClients;
    const watch = healthMetrics.watchClients;
    const critical = healthMetrics.criticalClients;

    return {
      healthy,
      watch,
      risk: Math.max(0, healthMetrics.trackedClients - healthy - watch - critical),
      critical,
      total: healthMetrics.trackedClients,
    };
  }

  return {
    healthy: clientHealth.healthyClients,
    watch: clientHealth.watchClients,
    risk: 0,
    critical: clientHealth.criticalClients,
    total: clientHealth.totalClients,
  };
}

export function isClientRequiringAttention(priority: ClientPriorityResult): boolean {
  return priority.score >= 26;
}

export function isReportOverdue(client: ClientOperationalMetrics): boolean {
  return (
    client.daysSinceLastPublishedReport == null ||
    client.daysSinceLastPublishedReport > REPORT_OVERDUE_DAYS
  );
}
