import { detectPredictiveAnomalies } from "@/lib/predictive/anomaly";
import { compareWindows, forecastMetric, projectRecurringRevenue } from "@/lib/predictive/forecasting";
import type {
  ClientPredictiveSnapshot,
  OrganizationPredictiveSnapshot,
} from "@/lib/predictive/queries";
import { buildOrganizationPredictiveSnapshot } from "@/lib/predictive/queries";
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
import {
  buildClientTrajectory,
  predictChurnRisk,
  predictClientHealth,
  predictClientRisk,
  predictIncidents,
} from "@/lib/predictive/models";
import { extractClientSignals } from "@/lib/predictive/signals";
import { persistPredictiveSnapshot } from "@/lib/predictive/record";
import { recordPredictiveActivitySafe } from "@/lib/predictive/activity";
import type { PredictiveSnapshotRecord } from "@/lib/predictive/types";
import type { SessionContext } from "@/lib/tenancy/context";

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
      href: `/predictive/${client.clientId}`,
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
      href: `/predictive/${client.clientId}`,
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
      href: `/predictive/${client.clientId}`,
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
        href: `/predictive/${client.clientId}`,
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
  const declining = result.clientRankings.filter((entry) => entry.healthScore < 55).length;
  const highChurn = result.customerForecast.likelyChurn.filter(
    (entry) => entry.churnProbability >= 55,
  ).length;

  return {
    customersAtRisk: result.customerForecast.likelyChurn.length,
    predictedSlaBreaches: result.slaForecast.upcomingBreaches.filter((item) => item.breachProbability >= 50)
      .length,
    predictedIncidents: result.incidentForecast.atRiskClients.filter(
      (item) => item.incidentProbability >= 40,
    ).length,
    revenueTrend: result.revenueForecast.trend,
    averageConfidence: result.overallConfidence.score,
    clientsDeclining: declining,
    highChurnRisk: highChurn,
    forecastAccuracy: null,
  };
}

type GenerateClientPredictionInput = {
  snapshot: ClientPredictiveSnapshot;
  organizationId: string;
  actorUserId?: string | null;
  persist?: boolean;
};

/** Generate and optionally persist a client prediction snapshot. */
export async function generateClientPrediction(
  input: GenerateClientPredictionInput,
): Promise<PredictiveSnapshotRecord | null> {
  const signals = extractClientSignals(input.snapshot);
  const confidence = computeClientConfidence(input.snapshot).score;
  const trajectory = buildClientTrajectory(input.snapshot);

  const payload = {
    organizationId: input.organizationId,
    clientId: input.snapshot.clientId,
    healthScore: signals.healthScore,
    riskScore: signals.riskScore,
    incidentCount: signals.incidentCount,
    breachCount: signals.breachCount,
    monitoringFailures: signals.monitoringFailures,
    engagementScore: signals.engagementScore,
    predictedHealth: predictClientHealth(input.snapshot),
    predictedRisk: predictClientRisk(input.snapshot),
    predictedIncidents: predictIncidents(input.snapshot),
    confidence,
    metadata: {
      trajectory,
      churnProbability: predictChurnRisk(input.snapshot),
      engineVersion: ENGINE_VERSION,
    },
  };

  if (!input.persist) {
    return {
      id: "ephemeral",
      organizationId: input.organizationId,
      clientId: input.snapshot.clientId,
      snapshotDate: new Date().toISOString().slice(0, 10),
      healthScore: payload.healthScore,
      riskScore: payload.riskScore,
      incidentCount: payload.incidentCount,
      breachCount: payload.breachCount,
      monitoringFailures: payload.monitoringFailures,
      engagementScore: payload.engagementScore,
      predictedHealth: payload.predictedHealth,
      predictedRisk: payload.predictedRisk,
      predictedIncidents: payload.predictedIncidents,
      confidence: payload.confidence,
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
    };
  }

  const saved = await persistPredictiveSnapshot(payload);
  if (saved) {
    await recordPredictiveActivitySafe({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      eventType: "predictive.snapshot_created",
      message: `Predictive snapshot created — ${input.snapshot.clientName}`,
      entityType: "client",
      entityId: input.snapshot.clientId,
      metadata: { trajectory, confidence },
    });

    if (trajectory === "declining" || trajectory === "critical") {
      await recordPredictiveActivitySafe({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        eventType: "predictive.health_declining",
        message: `Health trajectory ${trajectory} — ${input.snapshot.clientName}`,
        entityType: "client",
        entityId: input.snapshot.clientId,
        metadata: { predictedHealth: payload.predictedHealth },
      });
    }

    if (payload.predictedRisk >= 55) {
      await recordPredictiveActivitySafe({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        eventType: "predictive.risk_increasing",
        message: `Risk forecast elevated — ${input.snapshot.clientName}`,
        entityType: "client",
        entityId: input.snapshot.clientId,
        metadata: { predictedRisk: payload.predictedRisk },
      });
    }

    if ((payload.predictedIncidents ?? 0) >= 1) {
      await recordPredictiveActivitySafe({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        eventType: "predictive.incident_forecast",
        message: `Incident forecast — ${input.snapshot.clientName}`,
        entityType: "client",
        entityId: input.snapshot.clientId,
        metadata: { predictedIncidents: payload.predictedIncidents },
      });
    }

    if (predictChurnRisk(input.snapshot) >= 55) {
      await recordPredictiveActivitySafe({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        eventType: "predictive.churn_detected",
        message: `Churn risk detected — ${input.snapshot.clientName}`,
        entityType: "client",
        entityId: input.snapshot.clientId,
        metadata: { churnProbability: predictChurnRisk(input.snapshot) },
      });
    }
  }

  return saved;
}

type GeneratePredictiveSnapshotInput = {
  session: SessionContext;
  persist?: boolean;
  actorUserId?: string | null;
};

/** Generate org-wide predictive snapshots for all active clients. */
export async function generatePredictiveSnapshot(
  input: GeneratePredictiveSnapshotInput,
): Promise<PredictiveSnapshotRecord[]> {
  const orgSnapshot = await buildOrganizationPredictiveSnapshot(input.session);
  const results: PredictiveSnapshotRecord[] = [];

  for (const client of orgSnapshot.clients) {
    const saved = await generateClientPrediction({
      snapshot: client,
      organizationId: input.session.organization.id,
      actorUserId: input.actorUserId,
      persist: input.persist ?? false,
    });
    if (saved) results.push(saved);
  }

  if (input.persist) {
    await recordPredictiveActivitySafe({
      organizationId: input.session.organization.id,
      actorUserId: input.actorUserId,
      eventType: "predictive.generated",
      message: "Predictive intelligence generated",
      metadata: {
        clientCount: results.length,
        engineVersion: ENGINE_VERSION,
      },
    });
  }

  return results;
}
