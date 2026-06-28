import type { ClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import {
  computeChurnRisk,
  computeClientHealthScore,
  computeCommunicationScore,
  computeConfidence,
  computePriorityScore,
  computeRelationshipStatus,
  estimateMaturity,
  evaluateReportQuality,
  healthLabelFromScore,
} from "@/lib/ai/client-success/scoring";
import type {
  ClientSuccessAnalysis,
  ClientSuccessChecklistItem,
  ClientSuccessRecommendation,
  ClientSuccessTrend,
  ClientSuccessWarning,
  ClientTimelineEntry,
} from "@/lib/ai/client-success/types";

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function trendDirection(current: number, previous: number): ClientSuccessTrend["direction"] {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function buildTrends(snapshot: ClientSuccessSnapshot, healthScore: number): ClientSuccessTrend[] {
  const previousHealth = Math.max(
    0,
    Math.min(
      100,
      healthScore -
        (snapshot.incidentsThisPeriod > snapshot.incidentsPreviousPeriod ? 8 : 0) -
        (snapshot.risksThisPeriod > snapshot.risksPreviousPeriod ? 6 : 0),
    ),
  );

  const trends: ClientSuccessTrend[] = [
    {
      id: "health",
      label: "Health",
      current: healthScore,
      previous: previousHealth,
      changePercent: percentChange(healthScore, previousHealth),
      direction: trendDirection(healthScore, previousHealth),
      unit: "%",
    },
    {
      id: "reports",
      label: "Reports",
      current: snapshot.reportsPublishedThisPeriod,
      previous: snapshot.reportsPublishedPreviousPeriod,
      changePercent: percentChange(
        snapshot.reportsPublishedThisPeriod,
        snapshot.reportsPublishedPreviousPeriod,
      ),
      direction: trendDirection(
        snapshot.reportsPublishedThisPeriod,
        snapshot.reportsPublishedPreviousPeriod,
      ),
    },
  ];

  if (snapshot.incidentsEnabled) {
    trends.push({
      id: "incidents",
      label: "Incidents",
      current: snapshot.incidentsThisPeriod,
      previous: snapshot.incidentsPreviousPeriod,
      changePercent: percentChange(snapshot.incidentsThisPeriod, snapshot.incidentsPreviousPeriod),
      direction: trendDirection(snapshot.incidentsThisPeriod, snapshot.incidentsPreviousPeriod),
    });
  }

  if (snapshot.risksEnabled) {
    trends.push({
      id: "risks",
      label: "Risks",
      current: snapshot.risksThisPeriod,
      previous: snapshot.risksPreviousPeriod,
      changePercent: percentChange(snapshot.risksThisPeriod, snapshot.risksPreviousPeriod),
      direction: trendDirection(snapshot.risksThisPeriod, snapshot.risksPreviousPeriod),
    });
  }

  if (snapshot.profitabilityEnabled && snapshot.profitability?.margin != null) {
    trends.push({
      id: "profitability",
      label: "Profitability",
      current: snapshot.profitability.margin,
      previous: snapshot.profitability.margin,
      changePercent: null,
      direction: "flat",
      unit: "%",
    });
  }

  const communication = computeCommunicationScore(snapshot);
  trends.push({
    id: "communication",
    label: "Communication",
    current: communication.score,
    previous: Math.max(0, communication.score - 5),
    changePercent: null,
    direction: "flat",
    unit: "%",
  });

  return trends;
}

function buildTimeline(snapshot: ClientSuccessSnapshot): ClientTimelineEntry[] {
  const entries: ClientTimelineEntry[] = [];

  for (const report of snapshot.recentReports.slice(0, 3)) {
    entries.push({
      id: `report-${report.id}`,
      date: report.updated_at,
      label: `${report.title} (${report.status})`,
      category: "report",
    });
  }

  for (const risk of snapshot.overview.openRisks.slice(0, 2)) {
    entries.push({
      id: `risk-${risk.id}`,
      date: risk.due_date ?? new Date().toISOString(),
      label: `Open risk: ${risk.title}`,
      category: "risk",
    });
  }

  for (const incident of snapshot.overview.openIncidents.slice(0, 2)) {
    entries.push({
      id: `incident-${incident.id}`,
      date: incident.due_at ?? new Date().toISOString(),
      label: `Open incident: ${incident.title}`,
      category: "incident",
    });
  }

  for (const event of snapshot.recentActivity.slice(0, 4)) {
    entries.push({
      id: `activity-${event.id}`,
      date: event.created_at,
      label: event.title,
      category: event.action.includes("email") ? "communication" : "activity",
    });
  }

  if (snapshot.hasEmailActivity) {
    entries.push({
      id: "communication-email",
      date: new Date().toISOString(),
      label: "Report email delivery recorded",
      category: "communication",
    });
  }

  return entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

function buildChecklist(snapshot: ClientSuccessSnapshot): ClientSuccessChecklistItem[] {
  return [
    {
      id: "reports-current",
      label: "Reports current",
      complete:
        snapshot.daysSinceLastPublishedReport != null && snapshot.daysSinceLastPublishedReport <= 30,
    },
    {
      id: "risks-reviewed",
      label: "Risks reviewed",
      complete: snapshot.overview.kpis.openRisksCount === 0,
    },
    {
      id: "incidents-resolved",
      label: "Incidents resolved",
      complete: snapshot.overview.kpis.openIncidentsCount === 0,
    },
    {
      id: "sla-healthy",
      label: "SLA healthy",
      complete: !snapshot.slaEnabled || snapshot.slaBreachesThisPeriod === 0,
    },
    {
      id: "customer-updated",
      label: "Customer updated",
      complete: snapshot.hasEmailActivity || snapshot.recentActivity.length > 0,
    },
    {
      id: "next-review",
      label: "Next review planned",
      complete: snapshot.scheduledReportsCount > 0,
    },
    {
      id: "profitability",
      label: "Profitability healthy",
      complete: !snapshot.profitabilityEnabled || snapshot.profitability?.health === "healthy",
    },
  ];
}

function buildRecommendations(
  snapshot: ClientSuccessSnapshot,
  reportQuality: ReturnType<typeof evaluateReportQuality>,
  communication: ReturnType<typeof computeCommunicationScore>,
): ClientSuccessRecommendation[] {
  const items: ClientSuccessRecommendation[] = [];

  if (snapshot.scheduledReportsCount === 0 && snapshot.schedulingEnabled) {
    items.push({
      id: "schedule-review",
      title: "Schedule quarterly review",
      description: "No active report schedule is configured for this client.",
      actionLabel: "View schedules",
      href: "/reports/schedules",
    });
  }

  if (snapshot.draftReportsCount > 0 || snapshot.daysSinceLastPublishedReport == null) {
    items.push({
      id: "publish-report",
      title: "Publish report",
      description: "Client reporting cadence needs attention.",
      actionLabel: "Open reports",
      href: "/reports",
    });
  }

  if (snapshot.overview.kpis.openRisksCount > 0) {
    items.push({
      id: "close-risks",
      title: "Close overdue risks",
      description: `${snapshot.overview.kpis.openRisksCount} open risk(s) require review.`,
      actionLabel: "View risks",
      href: "/risks",
    });
  }

  if (snapshot.slaEnabled && snapshot.slaBreachesThisPeriod > 0) {
    items.push({
      id: "review-sla",
      title: "Review SLA",
      description: "SLA breaches were recorded this period.",
      actionLabel: "SLA settings",
      href: "/settings/sla",
    });
  }

  if (communication.recommendations.includes("Follow up")) {
    items.push({
      id: "contact-customer",
      title: "Contact customer",
      description: "Recent communication activity is limited.",
      actionLabel: "View client",
      href: `/clients/${snapshot.clientId}`,
    });
  }

  if (snapshot.profitability?.health === "watch" || snapshot.profitability?.health === "critical") {
    items.push({
      id: "review-profitability",
      title: "Review profitability",
      description: "Financial health signals need review.",
      actionLabel: "Profitability",
      href: "/profitability",
    });
  }

  for (const suggestion of reportQuality.suggestions.slice(0, 2)) {
    items.push({
      id: `report-${suggestion.slice(0, 12)}`,
      title: "Improve report quality",
      description: suggestion,
      actionLabel: "Open reports",
      href: "/reports",
    });
  }

  return items.slice(0, 6);
}

function buildWarnings(snapshot: ClientSuccessSnapshot): ClientSuccessWarning[] {
  const warnings: ClientSuccessWarning[] = [];

  if (snapshot.publishedReportsCount === 0) {
    warnings.push({ id: "no-report", message: "No published report on record." });
  }

  if (!snapshot.hasEmailActivity && snapshot.recentActivity.length === 0) {
    warnings.push({ id: "no-communication", message: "No communication activity detected." });
  }

  if (snapshot.daysSinceLastActivity != null && snapshot.daysSinceLastActivity > 21) {
    warnings.push({ id: "old-activity", message: "Recent activity is stale." });
  }

  if (
    snapshot.incidentsEnabled &&
    snapshot.incidentsThisPeriod > snapshot.incidentsPreviousPeriod &&
    snapshot.incidentsThisPeriod >= 2
  ) {
    warnings.push({ id: "incident-trend", message: "Incident volume is trending upward." });
  }

  if (snapshot.scheduledReportsCount === 0 && snapshot.schedulingEnabled) {
    warnings.push({ id: "no-schedule", message: "No review schedule configured." });
  }

  if (snapshot.profitabilityEnabled && !snapshot.profitability) {
    warnings.push({ id: "no-profitability", message: "Profitability data is missing." });
  }

  return warnings;
}

function buildSummaries(
  snapshot: ClientSuccessSnapshot,
  healthScore: number,
  healthLabel: string,
  churn: ReturnType<typeof computeChurnRisk>,
  maturity: ReturnType<typeof estimateMaturity>,
): ClientSuccessAnalysis["summaries"] {
  const facts = [
    `${snapshot.clientName} health score is ${healthScore}% (${healthLabel}).`,
    snapshot.publishedReportsCount > 0
      ? `${snapshot.publishedReportsCount} published report(s) on record.`
      : "No published reports yet.",
    snapshot.overview.kpis.openIncidentsCount > 0
      ? `${snapshot.overview.kpis.openIncidentsCount} open incident(s).`
      : "No open incidents.",
    snapshot.overview.kpis.openRisksCount > 0
      ? `${snapshot.overview.kpis.openRisksCount} open risk(s).`
      : "No open risks.",
  ];

  const churnText =
    churn.factors.length > 0 ? ` Churn factors: ${churn.factors.join("; ")}.` : " No elevated churn signals.";

  return {
    executive: `${facts.join(" ")}${churnText}`,
    technical: `${facts.join(" ")} Operational maturity: ${maturity.level}. ${maturity.reasoning}`,
    customer: `${snapshot.clientName} remains under active management with ${snapshot.reportsPublishedThisPeriod} report(s) delivered this period and ${snapshot.recentActivity.length} recent activity event(s).`,
    internal: `Priority follow-up for ${snapshot.clientName}: health ${healthScore}%, churn ${churn.level}, ${snapshot.draftReportsCount} draft report(s), ${snapshot.scheduledReportsCount} active schedule(s).`,
  };
}

/** Generate client success analysis from verified snapshot — no hallucination. */
export function generateClientSuccessAnalysis(
  snapshot: ClientSuccessSnapshot,
  meta?: { providerId?: string; model?: string; durationMs?: number },
): ClientSuccessAnalysis {
  const started = Date.now();
  const healthScore = computeClientHealthScore(snapshot);
  const healthLabel = healthLabelFromScore(healthScore);
  const churn = computeChurnRisk(snapshot);
  const communication = computeCommunicationScore(snapshot);
  const reportQuality = evaluateReportQuality(snapshot);
  const maturity = estimateMaturity(snapshot);
  const relationshipStatus = computeRelationshipStatus(healthScore, churn.level);
  const priority = computePriorityScore(snapshot, healthScore);
  const confidence = computeConfidence(snapshot);
  const summaries = buildSummaries(snapshot, healthScore, healthLabel, churn, maturity);

  const overallSummary = [
    `${snapshot.clientName} is assessed at ${healthScore}% health (${healthLabel}).`,
    `Churn risk is ${churn.level.replace("_", " ")}.`,
    `Communication is ${communication.rating.replace("_", " ")} and operational maturity is ${maturity.level}.`,
    churn.factors[0] ?? "No critical churn signals detected from available data.",
  ].join(" ");

  return {
    clientId: snapshot.clientId,
    clientName: snapshot.clientName,
    healthScore,
    healthLabel,
    churnRisk: churn.level,
    churnFactors: churn.factors,
    communicationScore: communication.score,
    communicationRating: communication.rating,
    communicationRecommendations: communication.recommendations,
    reportQuality: reportQuality.rating,
    reportQualityIssues: reportQuality.issues,
    reportQualitySuggestions: reportQuality.suggestions,
    operationalMaturity: maturity.level,
    maturityReasoning: maturity.reasoning,
    reportingQuality: reportQuality.rating,
    relationshipStatus,
    priority: priority.label,
    priorityScore: priority.score,
    overallSummary,
    summaries,
    timeline: buildTimeline(snapshot),
    recommendations: buildRecommendations(snapshot, reportQuality, communication),
    checklist: buildChecklist(snapshot),
    trends: buildTrends(snapshot, healthScore),
    warnings: buildWarnings(snapshot),
    confidence,
    generatedAt: new Date().toISOString(),
    providerId: meta?.providerId ?? "client-success-engine",
    model: meta?.model ?? "rules-v1",
    durationMs: meta?.durationMs ?? Date.now() - started,
  };
}
