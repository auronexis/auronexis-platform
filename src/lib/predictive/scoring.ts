import {
  computeChurnRisk,
  computeClientHealthScore,
  computeCommunicationScore,
} from "@/lib/ai/client-success/scoring";
import type { ClientPredictiveSnapshot } from "@/lib/predictive/queries";
import type {
  ChurnSegment,
  PredictiveConfidence,
  PredictiveConfidenceLabel,
  PredictiveTrendLabel,
} from "@/lib/predictive/types";

export function scoreToConfidenceLabel(score: number): PredictiveConfidenceLabel {
  if (score >= 85) return "Very High";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

export function computePredictiveConfidence(input: {
  dataQualityScore: number;
  historyLengthScore: number;
  reportCoverageScore: number;
  communicationCoverageScore: number;
  incidentHistoryScore: number;
  slaHistoryScore: number;
}): PredictiveConfidence {
  const score = Math.round(
    input.dataQualityScore * 0.2 +
      input.historyLengthScore * 0.2 +
      input.reportCoverageScore * 0.15 +
      input.communicationCoverageScore * 0.15 +
      input.incidentHistoryScore * 0.15 +
      input.slaHistoryScore * 0.15,
  );

  const factors: string[] = [];
  if (input.reportCoverageScore >= 70) factors.push("Report history available");
  else factors.push("Limited report coverage");

  if (input.communicationCoverageScore >= 70) factors.push("Communication signals present");
  else factors.push("Sparse communication activity");

  if (input.incidentHistoryScore >= 60) factors.push("Incident history tracked");
  if (input.slaHistoryScore >= 60) factors.push("SLA history tracked");
  if (input.historyLengthScore >= 70) factors.push("Sufficient historical depth");

  return {
    score: Math.max(0, Math.min(100, score)),
    label: scoreToConfidenceLabel(Math.max(0, Math.min(100, score))),
    factors,
  };
}

export function computeClientConfidence(snapshot: ClientPredictiveSnapshot): PredictiveConfidence {
  const { success } = snapshot;
  let dataQuality = 40;
  if (success.publishedReportsCount > 0) dataQuality += 20;
  if (success.recentActivity.length > 0) dataQuality += 15;
  if (snapshot.profitability) dataQuality += 15;
  if (success.hasEmailActivity) dataQuality += 10;

  const historyLength =
    success.publishedReportsCount >= 4
      ? 90
      : success.publishedReportsCount >= 1
        ? 60
        : 25;

  const reportCoverage =
    success.publishedReportsCount > 0
      ? Math.min(100, 50 + success.publishedReportsCount * 10)
      : 20;

  const communicationCoverage = computeCommunicationScore(success).score;
  const incidentHistory = success.incidentsEnabled
    ? Math.min(100, 40 + success.incidentsThisPeriod * 10 + success.incidentsPreviousPeriod * 5)
    : 30;
  const slaHistory = success.slaEnabled
    ? success.slaBreachesThisPeriod === 0
      ? 80
      : Math.max(20, 80 - success.slaBreachesThisPeriod * 15)
    : 30;

  return computePredictiveConfidence({
    dataQualityScore: dataQuality,
    historyLengthScore: historyLength,
    reportCoverageScore: reportCoverage,
    communicationCoverageScore: communicationCoverage,
    incidentHistoryScore: incidentHistory,
    slaHistoryScore: slaHistory,
  });
}

export function computeChurnProbability(snapshot: ClientPredictiveSnapshot): number {
  const churn = computeChurnRisk(snapshot.success);
  const mapping: Record<typeof churn.level, number> = {
    very_low: 8,
    low: 18,
    medium: 42,
    high: 68,
    critical: 88,
  };
  return mapping[churn.level];
}

export function classifyChurnSegment(
  snapshot: ClientPredictiveSnapshot,
  healthScore: number,
): ChurnSegment {
  const churn = computeChurnProbability(snapshot);
  if (churn >= 55) return "likely_churn";
  if (healthScore >= 75 && churn <= 25) return "growing";
  return "stable";
}

export function computeSlaBreachProbability(snapshot: ClientPredictiveSnapshot): number {
  if (!snapshot.success.slaEnabled) return 0;

  let probability = 5;
  probability += snapshot.success.overview.kpis.openIncidentsCount * 8;
  probability += snapshot.success.overview.kpis.openRisksCount * 6;
  probability += snapshot.success.slaBreachesThisPeriod * 12;

  if (snapshot.success.daysSinceLastActivity != null && snapshot.success.daysSinceLastActivity > 14) {
    probability += 10;
  }

  return Math.max(0, Math.min(95, Math.round(probability)));
}

export function computeIncidentProbability(snapshot: ClientPredictiveSnapshot): number {
  if (!snapshot.success.incidentsEnabled) return 0;

  let probability = 8;
  probability += snapshot.success.overview.kpis.openIncidentsCount * 10;
  probability += Math.max(0, snapshot.success.incidentsThisPeriod - snapshot.success.incidentsPreviousPeriod) * 12;

  if (snapshot.profitability?.health === "critical") probability += 15;
  if (snapshot.success.daysSinceLastPublishedReport != null && snapshot.success.daysSinceLastPublishedReport > 45) {
    probability += 10;
  }

  return Math.max(0, Math.min(92, Math.round(probability)));
}

export function predictIncidentSeverity(
  snapshot: ClientPredictiveSnapshot,
): "low" | "medium" | "high" | "critical" {
  const open = snapshot.success.overview.kpis.openIncidentsCount;
  if (open >= 3) return "critical";
  if (open >= 2) return "high";
  if (open >= 1) return "medium";
  if (snapshot.success.incidentsThisPeriod >= 2) return "medium";
  return "low";
}

export function computeRiskEscalationProbability(snapshot: ClientPredictiveSnapshot): number {
  if (!snapshot.success.risksEnabled) return 0;

  let probability = 6;
  probability += snapshot.success.overview.kpis.openRisksCount * 9;
  probability += Math.max(0, snapshot.success.risksThisPeriod - snapshot.success.risksPreviousPeriod) * 10;

  return Math.max(0, Math.min(90, Math.round(probability)));
}

export function computeReportOverdueProbability(snapshot: ClientPredictiveSnapshot): number {
  if (snapshot.success.daysSinceLastPublishedReport == null) return 85;
  if (snapshot.success.daysSinceLastPublishedReport > 60) return 90;
  if (snapshot.success.daysSinceLastPublishedReport > 45) return 75;
  if (snapshot.success.daysSinceLastPublishedReport > 30) return 55;
  if (snapshot.success.draftReportsCount > 0) return 40;
  return 10;
}

export function computeHealthTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  const score = computeClientHealthScore(snapshot.success);
  const previous = Math.max(
    0,
    score -
      (snapshot.success.incidentsThisPeriod > snapshot.success.incidentsPreviousPeriod ? 8 : 0) -
      (snapshot.success.risksThisPeriod > snapshot.success.risksPreviousPeriod ? 6 : 0),
  );

  if (score > previous + 5) return "improving";
  if (score < previous - 5) return "declining";
  return "stable";
}

export function computeProfitabilityTrend(snapshot: ClientPredictiveSnapshot): PredictiveTrendLabel {
  if (!snapshot.profitability) return "unknown";
  if (snapshot.profitability.health === "healthy") return "improving";
  if (snapshot.profitability.health === "critical") return "declining";
  return "stable";
}

export function computeAutomationSuccessTrend(
  windows: Array<{ automationSuccessRate: number | null; automationRuns: number }>,
): PredictiveTrendLabel {
  const recent = windows.find((window) => window.automationRuns > 0);
  if (!recent || recent.automationSuccessRate == null) return "unknown";
  if (recent.automationSuccessRate >= 85) return "improving";
  if (recent.automationSuccessRate < 60) return "declining";
  return "stable";
}

export function computeClientHealthScoreFromSnapshot(snapshot: ClientPredictiveSnapshot): number {
  return computeClientHealthScore(snapshot.success);
}

export function computePriorityScore(snapshot: ClientPredictiveSnapshot): number {
  const health = computeClientHealthScore(snapshot.success);
  const churn = computeChurnProbability(snapshot);
  return Math.max(0, Math.min(100, Math.round(100 - health + churn * 0.4)));
}
