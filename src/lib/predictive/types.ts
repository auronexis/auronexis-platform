/** Predictive intelligence types — deterministic, DB-backed only. */

export type PredictiveConfidenceLabel = "Very High" | "High" | "Medium" | "Low";

export type PredictiveTrendDirection = "up" | "down" | "flat";

export type HistoricalWindowKey = "7d" | "30d" | "90d" | "12m";

export type PredictiveTrendLabel =
  | "improving"
  | "stable"
  | "declining"
  | "critical"
  | "unknown";

export type PredictiveTrajectory = "improving" | "stable" | "declining" | "critical";

export type ChurnSegment = "likely_churn" | "stable" | "growing";

export type PredictiveConfidence = {
  score: number;
  label: PredictiveConfidenceLabel;
  factors: string[];
};

export type HistoricalWindowMetrics = {
  key: HistoricalWindowKey;
  label: string;
  incidents: number;
  risks: number;
  reportsPublished: number;
  slaBreaches: number;
  automationSuccessRate: number | null;
  automationRuns: number;
};

export type TrendComparison = {
  metric: string;
  current: number;
  historical: number;
  changePercent: number | null;
  direction: PredictiveTrendDirection;
  trend: PredictiveTrendLabel;
};

export type ForecastValue = {
  label: string;
  current: number;
  projected: number;
  direction: PredictiveTrendDirection;
  confidence: PredictiveConfidence;
};

export type CustomerForecastCard = {
  likelyChurn: Array<{ clientName: string; churnProbability: number; confidence: PredictiveConfidence }>;
  stableCustomers: Array<{ clientName: string; healthScore: number }>;
  growingCustomers: Array<{ clientName: string; healthScore: number; trend: PredictiveTrendLabel }>;
};

export type SlaForecastItem = {
  clientName: string;
  breachProbability: number;
  openItems: number;
  confidence: PredictiveConfidence;
  href: string;
};

export type SlaForecastCard = {
  upcomingBreaches: SlaForecastItem[];
  averageProbability: number | null;
};

export type IncidentForecastItem = {
  clientName: string;
  incidentProbability: number;
  predictedSeverity: "low" | "medium" | "high" | "critical";
  confidence: PredictiveConfidence;
  href: string;
};

export type IncidentForecastCard = {
  atRiskClients: IncidentForecastItem[];
};

export type RevenueForecastCard = {
  projectedRecurringRevenue: number | null;
  currentRecurringRevenue: number | null;
  trend: PredictiveTrendLabel;
  healthyAccounts: number;
  decliningAccounts: number;
  confidence: PredictiveConfidence;
};

export type PredictiveRecommendation = {
  id: string;
  title: string;
  explanation: string;
  reason: string;
  confidence: PredictiveConfidence;
  href: string;
  category:
    | "communication"
    | "reporting"
    | "sla"
    | "incidents"
    | "profitability"
    | "automation"
    | "retention";
};

export type ClientRankingEntry = {
  clientName: string;
  priorityScore: number;
  churnProbability: number;
  healthScore: number;
  href: string;
};

export type PredictiveRiskEntry = {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  href?: string;
};

export type PredictiveOpportunityEntry = {
  title: string;
  description: string;
  href?: string;
};

export type ClientPredictiveAnalysis = {
  clientId: string;
  clientName: string;
  healthForecast: ForecastValue;
  churnProbability: number;
  churnSegment: ChurnSegment;
  communicationForecast: ForecastValue;
  incidentForecast: ForecastValue;
  revenueTrend: PredictiveTrendLabel;
  recommendations: PredictiveRecommendation[];
  confidence: PredictiveConfidence;
  trends: TrendComparison[];
  generatedAt: string;
  engineVersion: string;
  durationMs: number;
};

export type PredictiveIntelligenceResult = {
  executiveOverview: string;
  customerForecast: CustomerForecastCard;
  slaForecast: SlaForecastCard;
  incidentForecast: IncidentForecastCard;
  revenueForecast: RevenueForecastCard;
  clientRankings: ClientRankingEntry[];
  risks: PredictiveRiskEntry[];
  opportunities: PredictiveOpportunityEntry[];
  recommendations: PredictiveRecommendation[];
  trends: TrendComparison[];
  historicalWindows: HistoricalWindowMetrics[];
  overallConfidence: PredictiveConfidence;
  forecastCount: number;
  generatedAt: string;
  engineVersion: string;
  durationMs: number;
};

export type PredictiveDashboardSummary = {
  customersAtRisk: number;
  predictedSlaBreaches: number;
  predictedIncidents: number;
  revenueTrend: PredictiveTrendLabel;
  averageConfidence: number;
  clientsDeclining: number;
  highChurnRisk: number;
  forecastAccuracy: number | null;
};

export type PredictiveMetrics = {
  totalClients: number;
  clientsDeclining: number;
  predictedIncidents: number;
  predictedBreaches: number;
  highChurnRisk: number;
  averageConfidence: number;
  forecastAccuracy: number | null;
  trajectory: PredictiveTrajectory;
};

export type PredictiveSummary = {
  metrics: PredictiveMetrics;
  topDecliningClients: Array<{
    clientId: string;
    clientName: string;
    trajectory: PredictiveTrajectory;
    predictedHealth: number | null;
    confidence: number;
    href: string;
  }>;
  executiveOverview: string;
  generatedAt: string | null;
};

export type ClientPredictiveSummary = {
  clientId: string;
  clientName: string;
  trajectory: PredictiveTrajectory;
  healthTrend: PredictiveTrendLabel;
  riskTrend: PredictiveTrendLabel;
  incidentTrend: PredictiveTrendLabel;
  confidence: PredictiveConfidence;
  topConcerns: string[];
  recommendedActions: string[];
  predictedHealth: number | null;
  predictedRisk: number | null;
  predictedIncidents: number | null;
  churnProbability: number;
};

export type PredictiveSnapshotRecord = {
  id: string;
  organizationId: string;
  clientId: string | null;
  snapshotDate: string;
  healthScore: number | null;
  riskScore: number | null;
  incidentCount: number | null;
  breachCount: number | null;
  monitoringFailures: number | null;
  engagementScore: number | null;
  predictedHealth: number | null;
  predictedRisk: number | null;
  predictedIncidents: number | null;
  confidence: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PredictiveDiagnosticsSnapshot = {
  engineVersion: string;
  forecastCount: number;
  averageConfidence: number;
  cacheHitRatio: number;
  refreshDurationMs: number | null;
  predictionLatencyMs: number | null;
  lastGeneratedAt: string | null;
};

export const PREDICTIVE_ENGINE_VERSION = "predictive-v2";
export const INSUFFICIENT_PREDICTIVE_DATA =
  "Not enough verified data to generate predictions for this client.";
