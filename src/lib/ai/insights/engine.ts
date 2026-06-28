import type { OperationalSnapshot } from "@/lib/ai/insights/queries";
import {
  buildClientPriorityRankings,
  computeWorkspaceHealth,
  insightConfidenceFromScore,
} from "@/lib/ai/insights/scoring";
import type {
  OperationalInsight,
  OperationalIntelligenceResult,
  OperationalRecommendation,
  TrendMetric,
} from "@/lib/ai/insights/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function trendDirection(current: number, previous: number): TrendMetric["direction"] {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function buildTrends(snapshot: OperationalSnapshot): TrendMetric[] {
  const trends: TrendMetric[] = [];

  if (snapshot.dashboard.features.incidents) {
    trends.push({
      id: "incidents",
      label: "Incidents",
      current: snapshot.incidentsCurrent,
      previous: snapshot.incidentsPrevious,
      changePercent: percentChange(snapshot.incidentsCurrent, snapshot.incidentsPrevious),
      direction: trendDirection(snapshot.incidentsCurrent, snapshot.incidentsPrevious),
    });
  }

  if (snapshot.dashboard.features.risks) {
    trends.push({
      id: "risks",
      label: "Risks",
      current: snapshot.risksCurrent,
      previous: snapshot.risksPrevious,
      changePercent: percentChange(snapshot.risksCurrent, snapshot.risksPrevious),
      direction: trendDirection(snapshot.risksCurrent, snapshot.risksPrevious),
    });
  }

  trends.push({
    id: "reports",
    label: "Reports published",
    current: snapshot.reportsPublishedCurrent,
    previous: snapshot.reportsPublishedPrevious,
    changePercent: percentChange(snapshot.reportsPublishedCurrent, snapshot.reportsPublishedPrevious),
    direction: trendDirection(snapshot.reportsPublishedCurrent, snapshot.reportsPublishedPrevious),
  });

  if (snapshot.dashboard.features.sla) {
    trends.push({
      id: "sla",
      label: "SLA breaches",
      current: snapshot.slaBreachesCurrent,
      previous: snapshot.slaBreachesPrevious,
      changePercent: percentChange(snapshot.slaBreachesCurrent, snapshot.slaBreachesPrevious),
      direction: trendDirection(snapshot.slaBreachesCurrent, snapshot.slaBreachesPrevious),
    });
  }

  if (snapshot.portfolioMargin != null && snapshot.clients.length >= 2) {
    // Snapshot-only margin indicator — no historical comparison available in DB.
    trends.push({
      id: "profitability",
      label: "Portfolio margin",
      current: snapshot.portfolioMargin,
      previous: snapshot.portfolioMargin,
      changePercent: null,
      direction: "flat",
      unit: "%",
    });
  }

  return trends;
}

function createInsight(
  partial: Omit<OperationalInsight, "timestamp" | "confidence" | "confidenceScore"> & {
    confidenceScore?: number;
  },
): OperationalInsight {
  const { confidence, confidenceScore } = insightConfidenceFromScore(partial.confidenceScore ?? 80);
  return {
    ...partial,
    confidence,
    confidenceScore,
    timestamp: new Date().toISOString(),
  };
}

function buildInsights(snapshot: OperationalSnapshot): OperationalInsight[] {
  const insights: OperationalInsight[] = [];
  const { dashboard } = snapshot;

  const criticalRisksFromAlerts = dashboard.criticalAlerts.filter((alert) => alert.type === "risk");
  if (dashboard.features.risks && criticalRisksFromAlerts.length > 0) {
    insights.push(
      createInsight({
        id: "critical-risks",
        title: `${criticalRisksFromAlerts.length} unresolved critical risk${criticalRisksFromAlerts.length === 1 ? "" : "s"}`,
        description: `There ${criticalRisksFromAlerts.length === 1 ? "is" : "are"} ${criticalRisksFromAlerts.length} unresolved critical risk${criticalRisksFromAlerts.length === 1 ? "" : "s"}.`,
        reason: "Open critical risks remain in the workspace.",
        recommendedAction: "Resolve overdue risks and update mitigation plans.",
        relatedClientId: null,
        relatedClientName: null,
        priority: "critical",
        category: "risk",
        confidenceScore: 95,
      }),
    );
  }

  if (dashboard.features.incidents && dashboard.openIncidentCount > 0) {
    insights.push(
      createInsight({
        id: "open-incidents",
        title: `${dashboard.openIncidentCount} open incident${dashboard.openIncidentCount === 1 ? "" : "s"} in queue`,
        description: `The incident backlog contains ${dashboard.openIncidentCount} active item${dashboard.openIncidentCount === 1 ? "" : "s"}.`,
        reason: "Open incidents require operational follow-up.",
        recommendedAction: "Review incident backlog and assign owners.",
        relatedClientId: null,
        relatedClientName: null,
        priority: dashboard.openIncidentCount >= 5 ? "high" : "medium",
        category: "incident",
        confidenceScore: 90,
      }),
    );
  }

  for (const client of snapshot.clients) {
    if (
      dashboard.features.incidents &&
      client.incidentsThisPeriod > client.incidentsPreviousPeriod &&
      client.incidentsThisPeriod >= 2
    ) {
      insights.push(
        createInsight({
          id: `incident-volume-${client.clientId}`,
          title: `${client.clientName} has increasing incident volume`,
          description: `Client ${client.clientName} recorded ${client.incidentsThisPeriod} incident${client.incidentsThisPeriod === 1 ? "" : "s"} this period vs ${client.incidentsPreviousPeriod} last period.`,
          reason: "Incident volume increased compared to the previous period.",
          recommendedAction: "Review incident backlog and increase communication with the client.",
          relatedClientId: client.clientId,
          relatedClientName: client.clientName,
          priority: "high",
          category: "incident",
          confidenceScore: 85,
        }),
      );
    }
  }

  if (
    dashboard.features.sla &&
    snapshot.slaBreachesCurrent > snapshot.slaBreachesPrevious &&
    snapshot.slaBreachesPrevious >= 0
  ) {
    insights.push(
      createInsight({
        id: "sla-compliance-drop",
        title: "SLA compliance dropped compared to last month",
        description: `SLA breaches increased from ${snapshot.slaBreachesPrevious} to ${snapshot.slaBreachesCurrent} compared to the previous period.`,
        reason: "More SLA breach events were recorded this period.",
        recommendedAction: "Review SLA policy adherence and remediation plans.",
        relatedClientId: null,
        relatedClientName: null,
        priority: snapshot.slaBreachesCurrent >= 3 ? "critical" : "high",
        category: "sla",
        confidenceScore: 88,
      }),
    );
  }

  if (snapshot.daysSinceLastOrgPublishedReport != null && snapshot.daysSinceLastOrgPublishedReport >= 30) {
    insights.push(
      createInsight({
        id: "no-recent-report",
        title: `No report has been published in ${snapshot.daysSinceLastOrgPublishedReport} days`,
        description: `The last published report was ${snapshot.daysSinceLastOrgPublishedReport} days ago.`,
        reason: "Reporting cadence has lapsed.",
        recommendedAction: "Schedule a report and publish the latest client update.",
        relatedClientId: null,
        relatedClientName: null,
        priority: snapshot.daysSinceLastOrgPublishedReport >= 45 ? "high" : "medium",
        category: "report",
        confidenceScore: 92,
      }),
    );
  }

  const decliningMarginClients = snapshot.clients.filter(
    (client) => client.profitability.margin != null && client.profitability.margin < 20,
  );
  if (decliningMarginClients.length > 0 && snapshot.portfolioMargin != null) {
    const lowest = decliningMarginClients.sort(
      (a, b) => (a.profitability.margin ?? 0) - (b.profitability.margin ?? 0),
    )[0];
    insights.push(
      createInsight({
        id: `profitability-${lowest.clientId}`,
        title: `${lowest.clientName} profitability needs review`,
        description: `${lowest.clientName} has a margin of ${lowest.profitability.margin}% — below the healthy threshold.`,
        reason: "Portfolio profitability data shows a low-margin client.",
        recommendedAction: "Review client financials and service scope.",
        relatedClientId: lowest.clientId,
        relatedClientName: lowest.clientName,
        priority: "medium",
        category: "profitability",
        confidenceScore: 80,
      }),
    );
  }

  if (snapshot.clientsNeedingAttention >= 2) {
    insights.push(
      createInsight({
        id: "customers-attention",
        title: `${snapshot.clientsNeedingAttention} customers require attention`,
        description: `${snapshot.clientsNeedingAttention} client${snapshot.clientsNeedingAttention === 1 ? "" : "s"} show elevated risk, incident, or health signals.`,
        reason: "Multiple clients exceed attention thresholds.",
        recommendedAction: "Review client ranking and prioritize follow-ups.",
        relatedClientId: null,
        relatedClientName: null,
        priority: "high",
        category: "customer_health",
        confidenceScore: 86,
      }),
    );
  }

  if (dashboard.draftReportsCount > 0) {
    insights.push(
      createInsight({
        id: "draft-reports",
        title: `${dashboard.draftReportsCount} report${dashboard.draftReportsCount === 1 ? "" : "s"} awaiting completion`,
        description: `${dashboard.draftReportsCount} draft report${dashboard.draftReportsCount === 1 ? "" : "s"} remain unpublished.`,
        reason: "Draft reports are pending review or publication.",
        recommendedAction: "Publish latest report or assign reviewers.",
        relatedClientId: null,
        relatedClientName: null,
        priority: "medium",
        category: "report",
        confidenceScore: 90,
      }),
    );
  }

  if (dashboard.features.sla && dashboard.slaMetrics.breachedCount > 0) {
    insights.push(
      createInsight({
        id: "active-sla-breaches",
        title: `${dashboard.slaMetrics.breachedCount} active SLA breach${dashboard.slaMetrics.breachedCount === 1 ? "" : "es"}`,
        description: `${dashboard.slaMetrics.breachedCount} SLA breach${dashboard.slaMetrics.breachedCount === 1 ? "" : "es"} require remediation.`,
        reason: "Current SLA posture includes breached items.",
        recommendedAction: "Review SLA policy and resolve breached items.",
        relatedClientId: null,
        relatedClientName: null,
        priority: "critical",
        category: "sla",
        confidenceScore: 93,
      }),
    );
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

function buildRecommendations(
  snapshot: OperationalSnapshot,
  insights: OperationalInsight[],
): OperationalRecommendation[] {
  const recommendations: OperationalRecommendation[] = [];

  if (snapshot.daysSinceLastOrgPublishedReport != null && snapshot.daysSinceLastOrgPublishedReport >= 14) {
    recommendations.push({
      id: "schedule-report",
      title: "Schedule a report",
      description: "Reporting cadence has slowed — schedule the next client report.",
      actionLabel: "View reports",
      href: "/reports",
    });
  }

  if (insights.some((insight) => insight.category === "risk")) {
    recommendations.push({
      id: "resolve-risks",
      title: "Resolve overdue risks",
      description: "Critical or open risks need owner follow-up.",
      actionLabel: "View risks",
      href: "/risks",
    });
  }

  if (insights.some((insight) => insight.category === "incident")) {
    recommendations.push({
      id: "review-incidents",
      title: "Review incident backlog",
      description: "Open incidents should be triaged and assigned.",
      actionLabel: "View incidents",
      href: "/incidents",
    });
  }

  if (snapshot.clientsNeedingAttention > 0) {
    recommendations.push({
      id: "increase-communication",
      title: "Increase communication",
      description: "Clients with elevated signals may need proactive outreach.",
      actionLabel: "View clients",
      href: "/clients",
    });
  }

  if (snapshot.dashboard.draftReportsCount > 0) {
    recommendations.push({
      id: "publish-report",
      title: "Publish latest report",
      description: "Draft reports are waiting to be finalized.",
      actionLabel: "Open reports",
      href: "/reports",
    });
  }

  if (snapshot.dashboard.features.sla && snapshot.slaBreachesCurrent > 0) {
    recommendations.push({
      id: "review-sla",
      title: "Review SLA policy",
      description: "SLA breaches were recorded this period.",
      actionLabel: "SLA settings",
      href: "/settings/sla",
    });
  }

  return recommendations.slice(0, 6);
}

/** Generate operational intelligence from a trusted snapshot — no hallucination. */
export function generateOperationalIntelligence(
  snapshot: OperationalSnapshot,
  meta?: { providerId?: string; model?: string; durationMs?: number },
): OperationalIntelligenceResult {
  const started = Date.now();
  const insights = buildInsights(snapshot);
  const clientRankings = buildClientPriorityRankings(snapshot);
  const workspaceHealth = computeWorkspaceHealth(snapshot);
  const trends = buildTrends(snapshot);
  const recommendations = buildRecommendations(snapshot, insights);

  const hasSufficientData =
    snapshot.dashboard.clientHealth.totalClients > 0 ||
    snapshot.dashboard.openRiskCount > 0 ||
    snapshot.dashboard.openIncidentCount > 0 ||
    snapshot.recentActivity.length > 0;

  return {
    insights,
    recommendations,
    trends,
    clientRankings,
    workspaceHealth,
    generatedAt: new Date().toISOString(),
    hasSufficientData,
    providerId: meta?.providerId ?? "operational-engine",
    model: meta?.model ?? "rules-v1",
    durationMs: meta?.durationMs ?? Date.now() - started,
  };
}
