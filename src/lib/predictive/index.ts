export type {
  ChurnSegment,
  ClientPredictiveAnalysis,
  ClientPredictiveSummary,
  ClientRankingEntry,
  CustomerForecastCard,
  ForecastValue,
  HistoricalWindowKey,
  HistoricalWindowMetrics,
  IncidentForecastCard,
  IncidentForecastItem,
  PredictiveConfidence,
  PredictiveConfidenceLabel,
  PredictiveDashboardSummary,
  PredictiveDiagnosticsSnapshot,
  PredictiveIntelligenceResult,
  PredictiveMetrics,
  PredictiveOpportunityEntry,
  PredictiveRecommendation,
  PredictiveRiskEntry,
  PredictiveSnapshotRecord,
  PredictiveSummary,
  PredictiveTrajectory,
  PredictiveTrendDirection,
  PredictiveTrendLabel,
  RevenueForecastCard,
  SlaForecastCard,
  SlaForecastItem,
  TrendComparison,
  INSUFFICIENT_PREDICTIVE_DATA,
  PREDICTIVE_ENGINE_VERSION,
} from "@/lib/predictive/types";

export {
  getClientPredictiveAnalysis,
  getPredictiveCacheHitRatio,
  getPredictiveCacheStats,
  getPredictiveDashboardSummary,
  getPredictiveDiagnosticsSnapshot,
  getPredictiveIntelligence,
  refreshClientPredictiveAnalysis,
  refreshPredictiveIntelligence,
} from "@/lib/predictive/cache";

export {
  refreshClientPredictiveServerAction,
  refreshPredictiveIntelligenceServerAction,
} from "@/lib/predictive/actions";

export {
  buildPredictiveDashboardSummary,
  generateClientPredictiveAnalysis,
  generateClientPrediction,
  generatePredictiveIntelligence,
  generatePredictiveSnapshot,
} from "@/lib/predictive/engine";

export {
  getClientPredictiveSummary,
  getPredictiveDashboardSummaryFromResult,
  getPredictiveMetrics,
  getPredictiveSummary,
} from "@/lib/predictive/summary";

export {
  calculateBreachTrend,
  calculateEngagementTrend,
  calculateHealthTrend,
  calculateIncidentTrend,
  calculateRiskTrend,
  predictChurnRisk,
  predictClientHealth,
  predictClientRisk,
  predictIncidents,
} from "@/lib/predictive/models";

export { extractClientSignals, extractOrganizationSignalSummary } from "@/lib/predictive/signals";

export { recordPredictiveActivity, recordPredictiveActivitySafe } from "@/lib/predictive/activity";

export { persistPredictiveSnapshot, listRecentPredictiveSnapshots } from "@/lib/predictive/record";
