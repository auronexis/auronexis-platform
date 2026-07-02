import "server-only";

import {
  buildPredictiveDashboardSummary,
  generateClientPredictiveAnalysis,
  generatePredictiveIntelligence,
} from "@/lib/predictive/engine";
import {
  buildClientTrajectory,
  predictChurnRisk,
  predictClientHealth,
  predictClientRisk,
  predictIncidents,
} from "@/lib/predictive/models";
import {
  buildClientPredictiveSnapshot,
  buildOrganizationPredictiveSnapshot,
} from "@/lib/predictive/queries";
import { listRecentPredictiveSnapshots } from "@/lib/predictive/record";
import { extractClientSignals } from "@/lib/predictive/signals";
import { generateClientRecommendations } from "@/lib/predictive/recommendations";
import {
  computeClientConfidence,
  computeHealthTrend,
  computeIncidentProbability,
  computeSlaBreachProbability,
} from "@/lib/predictive/scoring";
import type {
  ClientPredictiveSummary,
  PredictiveIntelligenceResult,
  PredictiveMetrics,
  PredictiveSummary,
  PredictiveTrajectory,
} from "@/lib/predictive/types";
import type { SessionContext } from "@/lib/tenancy/context";

function computeForecastAccuracy(
  snapshots: Awaited<ReturnType<typeof listRecentPredictiveSnapshots>>,
): number | null {
  const withActuals = snapshots.filter(
    (row) =>
      row.predictedHealth != null &&
      row.healthScore != null &&
      row.clientId != null,
  );

  if (withActuals.length < 2) return null;

  const errors = withActuals.map((row) =>
    Math.abs((row.predictedHealth ?? 0) - (row.healthScore ?? 0)),
  );
  const mae = errors.reduce((sum, value) => sum + value, 0) / errors.length;
  return Math.max(0, Math.min(100, Math.round(100 - mae)));
}

function countDecliningClients(result: PredictiveIntelligenceResult): number {
  return result.clientRankings.filter((entry) => entry.healthScore < 55).length;
}

function countHighChurn(result: PredictiveIntelligenceResult): number {
  return result.customerForecast.likelyChurn.filter((entry) => entry.churnProbability >= 55).length;
}

/** Organization-level predictive metrics. */
export function getPredictiveMetrics(result: PredictiveIntelligenceResult): PredictiveMetrics {
  const declining = countDecliningClients(result);
  const highChurn = countHighChurn(result);

  let trajectory: PredictiveTrajectory = "stable";
  if (highChurn >= 3 || declining >= 3) trajectory = "critical";
  else if (highChurn >= 1 || declining >= 2) trajectory = "declining";
  else if (result.revenueForecast.trend === "improving") trajectory = "improving";

  return {
    totalClients: result.clientRankings.length,
    clientsDeclining: declining,
    predictedIncidents: result.incidentForecast.atRiskClients.length,
    predictedBreaches: result.slaForecast.upcomingBreaches.length,
    highChurnRisk: highChurn,
    averageConfidence: result.overallConfidence.score,
    forecastAccuracy: null,
    trajectory,
  };
}

/** Organization-level predictive summary for routes and dashboard. */
export async function getPredictiveSummary(session: SessionContext): Promise<PredictiveSummary> {
  const snapshot = await buildOrganizationPredictiveSnapshot(session);
  const result = generatePredictiveIntelligence(snapshot);
  const metrics = getPredictiveMetrics(result);
  const stored = await listRecentPredictiveSnapshots(session.organization.id, 20);
  metrics.forecastAccuracy = computeForecastAccuracy(stored);

  const topDecliningClients = snapshot.clients
    .map((client) => {
      const trajectory = buildClientTrajectory(client);
      const confidence = computeClientConfidence(client).score;
      return {
        clientId: client.clientId,
        clientName: client.clientName,
        trajectory,
        predictedHealth: predictClientHealth(client),
        confidence,
        href: `/predictive/${client.clientId}`,
      };
    })
    .filter((entry) => entry.trajectory === "declining" || entry.trajectory === "critical")
    .sort((a, b) => a.predictedHealth - b.predictedHealth)
    .slice(0, 8);

  return {
    metrics,
    topDecliningClients,
    executiveOverview: result.executiveOverview,
    generatedAt: result.generatedAt,
  };
}

/** Client-level predictive summary for detail cards. */
export async function getClientPredictiveSummary(
  session: SessionContext,
  clientId: string,
): Promise<ClientPredictiveSummary | null> {
  const snapshot = await buildClientPredictiveSnapshot(session, clientId);
  if (!snapshot) return null;

  const analysis = generateClientPredictiveAnalysis(snapshot);
  const signals = extractClientSignals(snapshot);
  const trajectory = buildClientTrajectory(snapshot);
  const recommendations = generateClientRecommendations(snapshot);

  const topConcerns: string[] = [];
  if (analysis.churnProbability >= 45) {
    topConcerns.push(`Churn probability at ${analysis.churnProbability}%`);
  }
  if (computeIncidentProbability(snapshot) >= 35) {
    topConcerns.push("Elevated incident probability");
  }
  if (computeSlaBreachProbability(snapshot) >= 35) {
    topConcerns.push("SLA breach risk detected");
  }
  if (signals.inactivityDays != null && signals.inactivityDays > 14) {
    topConcerns.push(`${signals.inactivityDays} days since last activity`);
  }

  return {
    clientId: snapshot.clientId,
    clientName: snapshot.clientName,
    trajectory,
    healthTrend: computeHealthTrend(snapshot),
    riskTrend: analysis.trends.find((t) => t.metric === "Risk escalation probability")?.trend ?? "stable",
    incidentTrend: analysis.trends.find((t) => t.metric === "Incidents")?.trend ?? "stable",
    confidence: analysis.confidence,
    topConcerns: topConcerns.slice(0, 4),
    recommendedActions: recommendations.slice(0, 3).map((item) => item.title),
    predictedHealth: predictClientHealth(snapshot),
    predictedRisk: predictClientRisk(snapshot),
    predictedIncidents: predictIncidents(snapshot),
    churnProbability: predictChurnRisk(snapshot),
  };
}

export function getPredictiveDashboardSummaryFromResult(
  result: PredictiveIntelligenceResult,
): ReturnType<typeof buildPredictiveDashboardSummary> {
  const base = buildPredictiveDashboardSummary(result);
  return {
    ...base,
    clientsDeclining: countDecliningClients(result),
    highChurnRisk: countHighChurn(result),
    forecastAccuracy: null,
  };
}
