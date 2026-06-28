import { detectPredictiveAnomalies } from "@/lib/predictive/anomaly";
import { compareWindows, forecastMetric, projectRecurringRevenue } from "@/lib/predictive/forecasting";
import type {
  ClientPredictiveSnapshot,
  OrganizationPredictiveSnapshot,
} from "@/lib/predictive/queries";
import { generateClientRecommendations, generateWorkspaceRecommendations } from "@/lib/predictive/recommendations";
import {
  classifyChurnSegment,
  computeAutomationSuccessTrend,
  computeChurnProbability,
  computeClientConfidence,
  computeClientHealthScoreFromSnapshot,
  computeHealthTrend,
  computeIncidentProbability,
  computePredictiveConfidence,
  computePriorityScore,
  computeProfitabilityTrend,
  computeReportOverdueProbability,
  computeRiskEscalationProbability,
  computeSlaBreachProbability,
  predictIncidentSeverity,
} from "@/lib/predictive/scoring";
import { computeCommunicationScore } from "@/lib/ai/client-success/scoring";
import type {
  ClientPredictiveAnalysis,
  PredictiveDashboardSummary,
  PredictiveIntelligenceResult,
  PredictiveOpportunityEntry,
  PredictiveRiskEntry,
  PredictiveTrendLabel,
} from "@/lib/predictive/types";
import { PREDICTIVE_ENGINE_VERSION as ENGINE_VERSION } from "@/lib/predictive/types";

function buildExecutiveOverview(snapshot: OrganizationPredictiveSnapshot): string {
  const atRisk = snapshot.clients.filter((client) => computeChurnProbability(client) >= 55).length;
  const slaRisk = snapshot.clients.filter((client) => computeSlaBreachProbability(client) >= 50).length;
  const incidentRisk = snapshot.clients.filter(
    (client) => computeIncidentProbability(client) >= 50,
  ).length;

  return [
    `${snapshot.organizationName} predictive overview from verified workspace data.`,
    `${snapshot.clients.length} active client(s) analyzed.`,
    atRisk > 0 ? `${atRisk} account(s) show elevated churn probability.` : "No elevated churn clusters detected.",
    snapshot.slaEnabled && slaRisk > 0
      ? `${slaRisk} account(s) have elevated SLA breach probability.`
      : null,
    snapshot.incidentsEnabled && incidentRisk > 0
      ? `${incidentRisk} account(s) show elevated incident probability.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildCustomerForecast(snapshot: OrganizationPredictiveSnapshot) {
  const likelyChurn = snapshot.clients
    .map((client) => ({
      clientName: client.clientName,
      churnProbability: computeChurnProbability(client),
      confidence: computeClientConfidence(client),
    }))
    .filter((item) => item.churnProbability >= 45)
    .sort((a, b) => b.churnProbability - a.churnProbability)
    .slice(0, 6);

  const stableCustomers = snapshot.clients
    .filter((client) => classifyChurnSegment(client, computeClientHealthScoreFromSnapshot(client)) === "stable")
    .map((client) => ({
      clientName: client.clientName,
      healthScore: computeClientHealthScoreFromSnapshot(client),
    }))
    .slice(0, 6);

  const growingCustomers = snapshot.clients
    .filter((client) => classifyChurnSegment(client, computeClientHealthScoreFromSnapshot(client)) === "growing")
    .map((client) => ({
      clientName: client.clientName,
      healthScore: computeClientHealthScoreFromSnapshot(client),
      trend: computeHealthTrend(client),
    }))
    .slice(0, 6);

  return { likelyChurn, stableCustomers, growingCustomers };
}

function buildSlaForecast(snapshot: OrganizationPredictiveSnapshot) {
  if (!snapshot.slaEnabled) {
    return { upcomingBreaches: [], averageProbability: null };
  }

  const upcomingBreaches = snapshot.clients
    .map((client) => ({
      clientName: client.clientName,
      breachProbability: computeSlaBreachProbability(client),
      openItems:
        client.success.overview.kpis.openIncidentsCount + client.success.overview.kpis.openRisksCount,
      confidence: computeClientConfidence(client),
      href: `/clients/${client.clientId}`,
    }))
    .filter((item) => item.breachProbability >= 25)
    .sort((a, b) => b.breachProbability - a.breachProbability)
    .slice(0, 8);

  const averageProbability =
    upcomingBreaches.length > 0
      ? Math.round(
          upcomingBreaches.reduce((sum, item) => sum + item.breachProbability, 0) /
            upcomingBreaches.length,
        )
      : null;

  return { upcomingBreaches, averageProbability };
}

function buildIncidentForecast(snapshot: OrganizationPredictiveSnapshot) {
  if (!snapshot.incidentsEnabled) {
    return { atRiskClients: [] };
  }

  const atRiskClients = snapshot.clients
    .map((client) => ({
      clientName: client.clientName,
      incidentProbability: computeIncidentProbability(client),
      predictedSeverity: predictIncidentSeverity(client),
      confidence: computeClientConfidence(client),
      href: `/clients/${client.clientId}`,
    }))
    .filter((item) => item.incidentProbability >= 20)
    .sort((a, b) => b.incidentProbability - a.incidentProbability)
    .slice(0, 8);

  return { atRiskClients };
}

function buildRevenueForecast(snapshot: OrganizationPredictiveSnapshot) {
  const rows = snapshot.clients
    .map((client) => client.profitability)
    .filter((row): row is NonNullable<typeof row> => row != null);

  const currentRecurringRevenue = rows.reduce((sum, row) => sum + row.monthlyRevenue, 0);
  const healthyAccounts = rows.filter((row) => row.health === "healthy").length;
  const decliningAccounts = rows.filter((row) => row.health === "critical").length;

  const trend: PredictiveTrendLabel =
    decliningAccounts > healthyAccounts
      ? "declining"
      : healthyAccounts > decliningAccounts
        ? "improving"
        : "stable";

  const confidence = computePredictiveConfidence({
    dataQualityScore: rows.length > 0 ? 75 : 30,
    historyLengthScore: snapshot.clients.some((client) => client.success.publishedReportsCount > 0)
      ? 70
      : 35,
    reportCoverageScore:
      snapshot.clients.length > 0
        ? Math.round(
            (snapshot.clients.filter((client) => client.success.publishedReportsCount > 0).length /
              snapshot.clients.length) *
              100,
          )
        : 20,
    communicationCoverageScore:
      snapshot.clients.length > 0
        ? Math.round(
            (snapshot.clients.filter((client) => client.success.hasEmailActivity).length /
              snapshot.clients.length) *
              100,
          )
        : 20,
    incidentHistoryScore: snapshot.incidentsEnabled ? 60 : 30,
    slaHistoryScore: snapshot.slaEnabled ? 60 : 30,
  });

  return {
    projectedRecurringRevenue: snapshot.profitabilityEnabled
      ? projectRecurringRevenue(
          currentRecurringRevenue,
          healthyAccounts,
          decliningAccounts,
          snapshot.clients.length,
        )
      : null,
    currentRecurringRevenue: snapshot.profitabilityEnabled ? currentRecurringRevenue : null,
    trend,
    healthyAccounts,
    decliningAccounts,
    confidence,
  };
}

function buildClientRankings(snapshot: OrganizationPredictiveSnapshot) {
  return snapshot.clients
    .map((client) => ({
      clientName: client.clientName,
      priorityScore: computePriorityScore(client),
      churnProbability: computeChurnProbability(client),
      healthScore: computeClientHealthScoreFromSnapshot(client),
      href: `/clients/${client.clientId}`,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 10);
}

function buildRisks(snapshot: OrganizationPredictiveSnapshot): PredictiveRiskEntry[] {
  const anomalies = detectPredictiveAnomalies(snapshot);
  return anomalies.map((anomaly) => ({
    title: anomaly.title,
    description: anomaly.description,
    severity: anomaly.severity,
    href: anomaly.href,
  }));
}

function buildOpportunities(snapshot: OrganizationPredictiveSnapshot): PredictiveOpportunityEntry[] {
  const opportunities: PredictiveOpportunityEntry[] = [];

  for (const client of snapshot.clients) {
    const health = computeClientHealthScoreFromSnapshot(client);
    const churn = computeChurnProbability(client);
    if (health >= 80 && churn <= 20) {
      opportunities.push({
        title: `Expand ${client.clientName}`,
        description: "Strong health and low churn probability suggest expansion readiness.",
        href: `/clients/${client.clientId}`,
      });
    }
  }

  const automationTrend = computeAutomationSuccessTrend(snapshot.historicalWindows);
  if (automationTrend === "improving") {
    opportunities.push({
      title: "Scale automation coverage",
      description: "Verified automation success rate is trending upward.",
      href: "/automation",
    });
  }

  return opportunities.slice(0, 6);
}

function buildOverallConfidence(snapshot: OrganizationPredictiveSnapshot) {
  const avgClientConfidence =
    snapshot.clients.length > 0
      ? snapshot.clients.reduce((sum, client) => sum + computeClientConfidence(client).score, 0) /
        snapshot.clients.length
      : 35;

  return computePredictiveConfidence({
    dataQualityScore: avgClientConfidence,
    historyLengthScore: snapshot.historicalWindows.some((window) => window.reportsPublished > 0)
      ? 75
      : 40,
    reportCoverageScore:
      snapshot.clients.length > 0
        ? Math.round(
            (snapshot.clients.filter((client) => client.success.publishedReportsCount > 0).length /
              snapshot.clients.length) *
              100,
          )
        : 20,
    communicationCoverageScore:
      snapshot.clients.length > 0
        ? Math.round(
            (snapshot.clients.filter((client) => client.success.hasEmailActivity).length /
              snapshot.clients.length) *
              100,
          )
        : 20,
    incidentHistoryScore: snapshot.incidentsEnabled ? 65 : 30,
    slaHistoryScore: snapshot.slaEnabled ? 65 : 30,
  });
}

export function generatePredictiveIntelligence(
  snapshot: OrganizationPredictiveSnapshot,
  meta?: { durationMs?: number },
): PredictiveIntelligenceResult {
  const started = Date.now();
  const window7 = snapshot.historicalWindows.find((window) => window.key === "7d");
  const window30 = snapshot.historicalWindows.find((window) => window.key === "30d");
  const trends =
    window7 && window30 ? compareWindows(window7, window30) : [];

  const customerForecast = buildCustomerForecast(snapshot);
  const slaForecast = buildSlaForecast(snapshot);
  const incidentForecast = buildIncidentForecast(snapshot);
  const revenueForecast = buildRevenueForecast(snapshot);
  const recommendations = generateWorkspaceRecommendations(snapshot);

  const forecastCount =
    customerForecast.likelyChurn.length +
    slaForecast.upcomingBreaches.length +
    incidentForecast.atRiskClients.length +
    (revenueForecast.projectedRecurringRevenue != null ? 1 : 0);

  return {
    executiveOverview: buildExecutiveOverview(snapshot),
    customerForecast,
    slaForecast,
    incidentForecast,
    revenueForecast,
    clientRankings: buildClientRankings(snapshot),
    risks: buildRisks(snapshot),
    opportunities: buildOpportunities(snapshot),
    recommendations,
    trends,
    historicalWindows: snapshot.historicalWindows,
    overallConfidence: buildOverallConfidence(snapshot),
    forecastCount,
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    durationMs: meta?.durationMs ?? Date.now() - started,
  };
}

export function generateClientPredictiveAnalysis(
  snapshot: ClientPredictiveSnapshot,
  meta?: { durationMs?: number },
): ClientPredictiveAnalysis {
  const started = Date.now();
  const healthScore = computeClientHealthScoreFromSnapshot(snapshot);
  const communication = computeCommunicationScore(snapshot.success);
  const window7 = { incidents: snapshot.success.incidentsThisPeriod, risks: snapshot.success.risksThisPeriod };
  const window30 = {
    incidents: snapshot.success.incidentsPreviousPeriod,
    risks: snapshot.success.risksPreviousPeriod,
  };

  const healthForecastRaw = forecastMetric("Health score", healthScore, Math.max(0, healthScore - 5));
  const communicationForecastRaw = forecastMetric(
    "Communication score",
    communication.score,
    Math.max(0, communication.score - 8),
  );
  const incidentForecastRaw = forecastMetric(
    "Incident probability",
    computeIncidentProbability(snapshot),
    Math.max(0, computeIncidentProbability(snapshot) - 10),
    true,
  );

  const confidence = computeClientConfidence(snapshot);

  return {
    clientId: snapshot.clientId,
    clientName: snapshot.clientName,
    healthForecast: {
      label: healthForecastRaw.label,
      current: healthForecastRaw.current,
      projected: healthForecastRaw.projected,
      direction: healthForecastRaw.direction,
      confidence,
    },
    churnProbability: computeChurnProbability(snapshot),
    churnSegment: classifyChurnSegment(snapshot, healthScore),
    communicationForecast: {
      label: communicationForecastRaw.label,
      current: communicationForecastRaw.current,
      projected: communicationForecastRaw.projected,
      direction: communicationForecastRaw.direction,
      confidence,
    },
    incidentForecast: {
      label: incidentForecastRaw.label,
      current: incidentForecastRaw.current,
      projected: incidentForecastRaw.projected,
      direction: incidentForecastRaw.direction,
      confidence,
    },
    revenueTrend: computeProfitabilityTrend(snapshot),
    recommendations: generateClientRecommendations(snapshot),
    confidence,
    trends: [
      {
        metric: "Incidents",
        current: window7.incidents,
        historical: window30.incidents,
        changePercent:
          window30.incidents === 0
            ? window7.incidents === 0
              ? 0
              : null
            : Math.round(((window7.incidents - window30.incidents) / window30.incidents) * 100),
        direction:
          window7.incidents > window30.incidents
            ? "up"
            : window7.incidents < window30.incidents
              ? "down"
              : "flat",
        trend: computeHealthTrend(snapshot),
      },
      {
        metric: "Report overdue probability",
        current: computeReportOverdueProbability(snapshot),
        historical: Math.max(0, computeReportOverdueProbability(snapshot) - 10),
        changePercent: null,
        direction: "flat",
        trend: computeHealthTrend(snapshot),
      },
      {
        metric: "Risk escalation probability",
        current: computeRiskEscalationProbability(snapshot),
        historical: Math.max(0, computeRiskEscalationProbability(snapshot) - 8),
        changePercent: null,
        direction: "flat",
        trend: computeProfitabilityTrend(snapshot),
      },
    ],
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    durationMs: meta?.durationMs ?? Date.now() - started,
  };
}

export function buildPredictiveDashboardSummary(
  result: PredictiveIntelligenceResult,
): PredictiveDashboardSummary {
  return {
    customersAtRisk: result.customerForecast.likelyChurn.length,
    predictedSlaBreaches: result.slaForecast.upcomingBreaches.filter((item) => item.breachProbability >= 50)
      .length,
    predictedIncidents: result.incidentForecast.atRiskClients.filter(
      (item) => item.incidentProbability >= 40,
    ).length,
    revenueTrend: result.revenueForecast.trend,
    averageConfidence: result.overallConfidence.score,
  };
}
