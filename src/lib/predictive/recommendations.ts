import type { ClientPredictiveSnapshot, OrganizationPredictiveSnapshot } from "@/lib/predictive/queries";
import {
  computeChurnProbability,
  computeClientHealthScoreFromSnapshot,
  computeIncidentProbability,
  computeReportOverdueProbability,
  computeRiskEscalationProbability,
  computeSlaBreachProbability,
  predictIncidentSeverity,
} from "@/lib/predictive/scoring";
import type { PredictiveRecommendation } from "@/lib/predictive/types";

function recommendation(
  partial: Omit<PredictiveRecommendation, "confidence"> & {
    confidenceScore: number;
    confidenceFactors?: string[];
  },
): PredictiveRecommendation {
  const score = Math.max(0, Math.min(100, partial.confidenceScore));
  let label: PredictiveRecommendation["confidence"]["label"] = "Low";
  if (score >= 85) label = "Very High";
  else if (score >= 70) label = "High";
  else if (score >= 45) label = "Medium";

  return {
    id: partial.id,
    title: partial.title,
    explanation: partial.explanation,
    reason: partial.reason,
    href: partial.href,
    category: partial.category,
    confidence: {
      score,
      label,
      factors: partial.confidenceFactors ?? [partial.reason],
    },
  };
}

export function generateWorkspaceRecommendations(
  snapshot: OrganizationPredictiveSnapshot,
): PredictiveRecommendation[] {
  const items: PredictiveRecommendation[] = [];

  for (const client of snapshot.clients) {
    const churn = computeChurnProbability(client);
    const health = computeClientHealthScoreFromSnapshot(client);
    const overdue = computeReportOverdueProbability(client);
    const sla = computeSlaBreachProbability(client);
    const incident = computeIncidentProbability(client);
    const risk = computeRiskEscalationProbability(client);

    if (churn >= 55) {
      items.push(
        recommendation({
          id: `contact-${client.clientId}`,
          title: "Contact customer this week",
          explanation: `${client.clientName} shows elevated churn signals from verified activity and reporting data.`,
          reason: `Churn probability estimated at ${churn}% from open items and communication gaps.`,
          href: `/clients/${client.clientId}`,
          category: "communication",
          confidenceScore: Math.min(95, churn + 10),
          confidenceFactors: ["Churn signals from verified client history"],
        }),
      );
    }

    if (overdue >= 55) {
      items.push(
        recommendation({
          id: `publish-${client.clientId}`,
          title: "Publish report now",
          explanation: `${client.clientName} reporting cadence is behind verified schedule expectations.`,
          reason: `Report overdue probability is ${overdue}% based on days since last published report.`,
          href: `/reports`,
          category: "reporting",
          confidenceScore: overdue,
        }),
      );
    }

    if (client.success.daysSinceLastActivity != null && client.success.daysSinceLastActivity > 21) {
      items.push(
        recommendation({
          id: `communicate-${client.clientId}`,
          title: "Increase communication",
          explanation: `${client.clientName} has limited recent activity in the verified timeline.`,
          reason: `${client.success.daysSinceLastActivity} days since last recorded activity.`,
          href: `/clients/${client.clientId}`,
          category: "communication",
          confidenceScore: 65,
        }),
      );
    }

    if (sla >= 50 && snapshot.slaEnabled) {
      items.push(
        recommendation({
          id: `sla-${client.clientId}`,
          title: "Review SLA",
          explanation: `${client.clientName} has open operational items that increase SLA breach likelihood.`,
          reason: `SLA breach probability estimated at ${sla}%.`,
          href: `/settings/sla`,
          category: "sla",
          confidenceScore: sla,
        }),
      );
    }

    if (incident >= 50 && snapshot.incidentsEnabled) {
      items.push(
        recommendation({
          id: `incident-${client.clientId}`,
          title: "Investigate incident trend",
          explanation: `${client.clientName} incident volume or open incidents suggest rising operational risk.`,
          reason: `Incident probability estimated at ${incident}%.`,
          href: `/incidents`,
          category: "incidents",
          confidenceScore: incident,
        }),
      );
    }

    if (risk >= 45 && snapshot.risksEnabled) {
      items.push(
        recommendation({
          id: `risk-${client.clientId}`,
          title: "Review risk escalation",
          explanation: `${client.clientName} open risks may escalate based on recent creation trends.`,
          reason: `Risk escalation probability estimated at ${risk}%.`,
          href: `/risks`,
          category: "retention",
          confidenceScore: risk,
        }),
      );
    }

    if (
      snapshot.profitabilityEnabled &&
      (client.profitability?.health === "watch" || client.profitability?.health === "critical")
    ) {
      items.push(
        recommendation({
          id: `profit-${client.clientId}`,
          title: "Review profitability",
          explanation: `${client.clientName} financial health requires review based on verified margin data.`,
          reason: `Profitability health is ${client.profitability?.health ?? "unknown"}.`,
          href: `/profitability`,
          category: "profitability",
          confidenceScore: client.profitability?.health === "critical" ? 82 : 68,
        }),
      );
    }

    if (health < 35) {
      items.push(
        recommendation({
          id: `attention-${client.clientId}`,
          title: "Prioritize account review",
          explanation: `${client.clientName} health score is below critical threshold.`,
          reason: `Health score ${health}% from verified KPIs.`,
          href: `/clients/${client.clientId}`,
          category: "retention",
          confidenceScore: 100 - health,
        }),
      );
    }
  }

  const inactive = snapshot.clients.filter((client) => client.success.clientStatus === "archived");
  if (inactive.length === 0) {
    const stale = snapshot.clients.filter(
      (client) =>
        client.success.daysSinceLastActivity != null && client.success.daysSinceLastActivity > 90,
    );
    for (const client of stale.slice(0, 2)) {
      items.push(
        recommendation({
          id: `archive-review-${client.clientId}`,
          title: "Archive inactive customers",
          explanation: `${client.clientName} shows prolonged inactivity in verified records.`,
          reason: "No meaningful activity detected in extended period.",
          href: `/clients/${client.clientId}`,
          category: "retention",
          confidenceScore: 55,
        }),
      );
    }
  }

  return dedupeRecommendations(items).slice(0, 12);
}

export function generateClientRecommendations(
  snapshot: ClientPredictiveSnapshot,
): PredictiveRecommendation[] {
  const org: OrganizationPredictiveSnapshot = {
    organizationId: snapshot.success.clientId,
    organizationName: snapshot.clientName,
    clients: [snapshot],
    historicalWindows: [],
    risksEnabled: snapshot.success.risksEnabled,
    incidentsEnabled: snapshot.success.incidentsEnabled,
    slaEnabled: snapshot.success.slaEnabled,
    profitabilityEnabled: snapshot.success.profitabilityEnabled,
    automationEnabled: false,
  };

  return generateWorkspaceRecommendations(org).slice(0, 6);
}

function dedupeRecommendations(items: PredictiveRecommendation[]): PredictiveRecommendation[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export { predictIncidentSeverity };
