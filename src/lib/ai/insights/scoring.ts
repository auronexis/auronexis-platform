import type {
  ClientPriorityEntry,
  ClientPriorityLabel,
  CustomerHealthLabel,
  WorkspaceHealthSummary,
} from "@/lib/ai/insights/types";
import type { OperationalSnapshot } from "@/lib/ai/insights/queries";

export function mapProfitabilityHealthToCustomerHealth(
  health: "healthy" | "watch" | "critical",
  urgentFactors: number,
): CustomerHealthLabel {
  if (urgentFactors >= 3 || health === "critical") return "critical";
  if (urgentFactors >= 1 || health === "watch") return "attention";
  if (health === "healthy") return "healthy";
  return "watch";
}

export function computeClientPriorityScore(client: OperationalSnapshot["clients"][number]): number {
  let score = 0;

  score += client.criticalIncidents * 18;
  score += client.criticalRisks * 16;
  score += client.openIncidents * 6;
  score += client.openRisks * 5;
  score += client.slaBreachesThisPeriod * 12;

  if (client.daysSinceLastPublishedReport != null && client.daysSinceLastPublishedReport > 30) {
    score += Math.min(20, Math.floor(client.daysSinceLastPublishedReport / 7) * 3);
  }

  if (client.profitability.health === "critical") score += 15;
  else if (client.profitability.health === "watch") score += 8;

  if (client.incidentsThisPeriod > client.incidentsPreviousPeriod) {
    score += 10;
  }

  if (client.recentActivityCount === 0) score += 4;

  return Math.min(100, Math.max(0, score));
}

export function priorityLabelFromScore(score: number): ClientPriorityLabel {
  if (score >= 76) return "critical";
  if (score >= 51) return "attention";
  if (score >= 26) return "good";
  return "excellent";
}

export function buildClientPriorityRankings(snapshot: OperationalSnapshot): ClientPriorityEntry[] {
  return snapshot.clients
    .map((client) => {
      const score = computeClientPriorityScore(client);
      const urgentFactors =
        client.criticalIncidents +
        client.criticalRisks +
        (client.slaBreachesThisPeriod > 0 ? 1 : 0) +
        (client.daysSinceLastPublishedReport != null && client.daysSinceLastPublishedReport > 30
          ? 1
          : 0);

      const factors: string[] = [];
      if (client.criticalIncidents > 0) factors.push(`${client.criticalIncidents} critical incident(s)`);
      if (client.criticalRisks > 0) factors.push(`${client.criticalRisks} critical risk(s)`);
      if (client.slaBreachesThisPeriod > 0) factors.push(`${client.slaBreachesThisPeriod} SLA breach(es)`);
      if (client.daysSinceLastPublishedReport != null && client.daysSinceLastPublishedReport > 30) {
        factors.push(`No published report in ${client.daysSinceLastPublishedReport} days`);
      }
      if (client.profitability.health !== "healthy") {
        factors.push(`${client.profitability.health} profitability health`);
      }

      return {
        clientId: client.clientId,
        clientName: client.clientName,
        score,
        label: priorityLabelFromScore(score),
        healthLabel: mapProfitabilityHealthToCustomerHealth(
          client.profitability.health,
          urgentFactors,
        ),
        factors,
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Workspace health = average of the canonical client health scores (the same scores shown on the
 * client list), so the dashboard number matches what users see per client.
 */
export function computeWorkspaceHealth(snapshot: OperationalSnapshot): WorkspaceHealthSummary {
  const scores = snapshot.clients
    .map((client) => client.healthScore)
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return { score: 100, label: "Excellent" };
  }

  const clamped = Math.max(
    0,
    Math.min(100, Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)),
  );

  let label = "Critical";
  if (clamped >= 85) label = "Excellent";
  else if (clamped >= 70) label = "Good";
  else if (clamped >= 50) label = "Attention";

  return { score: clamped, label };
}

export function insightConfidenceFromScore(score: number): {
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
} {
  const confidenceScore = Math.max(0, Math.min(100, score));
  let confidence: "high" | "medium" | "low" = "low";
  if (confidenceScore >= 75) confidence = "high";
  else if (confidenceScore >= 50) confidence = "medium";
  return { confidence, confidenceScore };
}
