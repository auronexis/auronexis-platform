import type { ClientPredictiveSnapshot } from "@/lib/predictive/queries";
import {
  computeChurnProbability,
  computeClientHealthScoreFromSnapshot,
  computeHealthTrend,
  computeIncidentProbability,
  computeProfitabilityTrend,
  computeRiskEscalationProbability,
  computeSlaBreachProbability,
  predictIncidentSeverity,
} from "@/lib/predictive/scoring";
import { forecastMetric } from "@/lib/predictive/forecasting";
import type { PredictiveTrajectory, PredictiveTrendLabel } from "@/lib/predictive/types";

export function scoreToTrajectory(
  health: number,
  risk: number,
  churn: number,
): PredictiveTrajectory {
  if (health <= 35 || churn >= 70 || risk >= 75) return "critical";
  if (health <= 55 || churn >= 50 || risk >= 55) return "declining";
  if (health >= 75 && churn <= 25 && risk <= 30) return "improving";
  return "stable";
}

export function predictClientHealth(snapshot: ClientPredictiveSnapshot): number {
  const current = computeClientHealthScoreFromSnapshot(snapshot);
  const trend = computeHealthTrend(snapshot);
  if (trend === "improving") return Math.min(100, current + 5);
  if (trend === "declining") return Math.max(0, current - 8);
  if (trend === "critical") return Math.max(0, current - 15);
  return current;
}

export function predictClientRisk(snapshot: ClientPredictiveSnapshot): number {
  const escalation = computeRiskEscalationProbability(snapshot);
  const breach = computeSlaBreachProbability(snapshot);
  return Math.max(0, Math.min(100, Math.round((escalation + breach) / 2)));
}

export function predictIncidents(snapshot: ClientPredictiveSnapshot): number {
  const probability = computeIncidentProbability(snapshot);
  const severity = predictIncidentSeverity(snapshot);
  const severityWeight =
    severity === "critical" ? 3 : severity === "high" ? 2 : severity === "medium" ? 1 : 0;
  return Math.max(0, Math.min(10, Math.round((probability / 100) * 4 + severityWeight)));
}

export function predictChurnRisk(snapshot: ClientPredictiveSnapshot): number {
  return computeChurnProbability(snapshot);
}

export function calculateHealthTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  return computeHealthTrend(snapshot);
}

export function calculateRiskTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  const current = computeRiskEscalationProbability(snapshot);
  const previous = Math.max(0, current - 8);
  if (current > previous + 5) return "declining";
  if (current < previous - 5) return "improving";
  return "stable";
}

export function calculateIncidentTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  const current = snapshot.success.incidentsThisPeriod;
  const previous = snapshot.success.incidentsPreviousPeriod;
  if (current > previous) return "declining";
  if (current < previous) return "improving";
  return "stable";
}

export function calculateBreachTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  if (!snapshot.success.slaEnabled) return "unknown";
  if (snapshot.success.slaBreachesThisPeriod > 0) return "declining";
  return "stable";
}

export function calculateEngagementTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  if (snapshot.success.daysSinceLastActivity == null) return "unknown";
  if (snapshot.success.daysSinceLastActivity > 21) return "declining";
  if (snapshot.success.daysSinceLastActivity <= 7) return "improving";
  return "stable";
}

export function buildClientTrajectory(snapshot: ClientPredictiveSnapshot): PredictiveTrajectory {
  return scoreToTrajectory(
    predictClientHealth(snapshot),
    predictClientRisk(snapshot),
    predictChurnRisk(snapshot),
  );
}

export function buildHealthForecastValue(snapshot: ClientPredictiveSnapshot) {
  const current = computeClientHealthScoreFromSnapshot(snapshot);
  return forecastMetric("Health score", current, predictClientHealth(snapshot));
}

export function buildRiskForecastValue(snapshot: ClientPredictiveSnapshot) {
  const current = predictClientRisk(snapshot);
  return forecastMetric("Risk score", current, Math.min(100, current + 5), true);
}

export function buildIncidentForecastValue(snapshot: ClientPredictiveSnapshot) {
  const current = computeIncidentProbability(snapshot);
  return forecastMetric(
    "Incident probability",
    current,
    Math.max(0, current - 5),
    true,
  );
}

export function buildEngagementForecastValue(snapshot: ClientPredictiveSnapshot) {
  const inactivity =
    snapshot.success.daysSinceLastActivity == null
      ? 50
      : Math.max(0, 100 - snapshot.success.daysSinceLastActivity * 3);
  return forecastMetric(
    "Engagement score",
    inactivity,
    Math.max(0, inactivity - 10),
  );
}

export { computeProfitabilityTrend as calculateRevenueTrend };
