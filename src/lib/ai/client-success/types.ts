/** AI Client Success Copilot — shared types. */

export type ClientHealthLabel =
  | "excellent"
  | "healthy"
  | "watch"
  | "attention"
  | "critical";

export type ChurnRiskLevel = "very_low" | "low" | "medium" | "high" | "critical";

export type CommunicationRating = "excellent" | "good" | "needs_attention" | "poor";

export type ReportQualityRating = "excellent" | "good" | "needs_improvement" | "poor";

export type MaturityLevel = "reactive" | "developing" | "managed" | "optimized" | "strategic";

export type RelationshipStatus = "strong" | "stable" | "at_risk" | "critical";

export type ClientPriorityLabel = "excellent" | "good" | "attention" | "critical";

export type ConfidenceLabel = "high" | "medium" | "low";

export type TrendDirection = "up" | "down" | "flat";

export type ClientSuccessTrend = {
  id: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
  direction: TrendDirection;
  unit?: string;
};

export type ClientSuccessWarning = {
  id: string;
  message: string;
};

export type ClientSuccessChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type ClientSuccessRecommendation = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
};

export type ClientTimelineEntry = {
  id: string;
  date: string;
  label: string;
  category: "report" | "incident" | "risk" | "activity" | "communication";
};

export type ClientSuccessSummaries = {
  executive: string;
  technical: string;
  customer: string;
  internal: string;
};

export type ClientSuccessAnalysis = {
  clientId: string;
  clientName: string;
  healthScore: number;
  healthLabel: ClientHealthLabel;
  churnRisk: ChurnRiskLevel;
  churnFactors: string[];
  communicationScore: number;
  communicationRating: CommunicationRating;
  communicationRecommendations: string[];
  reportQuality: ReportQualityRating;
  reportQualityIssues: string[];
  reportQualitySuggestions: string[];
  operationalMaturity: MaturityLevel;
  maturityReasoning: string;
  reportingQuality: ReportQualityRating;
  relationshipStatus: RelationshipStatus;
  priority: ClientPriorityLabel;
  priorityScore: number;
  overallSummary: string;
  summaries: ClientSuccessSummaries;
  timeline: ClientTimelineEntry[];
  recommendations: ClientSuccessRecommendation[];
  checklist: ClientSuccessChecklistItem[];
  trends: ClientSuccessTrend[];
  warnings: ClientSuccessWarning[];
  confidence: { score: number; label: ConfidenceLabel };
  generatedAt: string;
  providerId: string;
  model: string;
  durationMs: number;
};

export type ClientSuccessPortfolioEntry = ClientSuccessAnalysis & {
  monthlyRevenue: number;
  margin: number | null;
  status: string;
  openRisks: number;
  openIncidents: number;
};

export type CustomerSuccessHighlight = {
  id: string;
  message: string;
  priority: ClientPriorityLabel;
};

export type ClientSuccessPortfolioResult = {
  clients: ClientSuccessPortfolioEntry[];
  highlights: CustomerSuccessHighlight[];
  highestRisk: ClientSuccessPortfolioEntry[];
  highestValue: ClientSuccessPortfolioEntry[];
  mostImproved: ClientSuccessPortfolioEntry[];
  needsAttention: ClientSuccessPortfolioEntry[];
  bestPerforming: ClientSuccessPortfolioEntry[];
  generatedAt: string;
  providerId: string;
  model: string;
  durationMs: number;
};

export type ClientSuccessHistoryEntry = {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  durationMs: number;
  tokens: number | null;
  analysisSummary: string;
};

export const CLIENT_HEALTH_LABELS: Record<ClientHealthLabel, string> = {
  excellent: "Excellent",
  healthy: "Healthy",
  watch: "Watch",
  attention: "Attention",
  critical: "Critical",
};

export const CHURN_RISK_LABELS: Record<ChurnRiskLevel, string> = {
  very_low: "Very Low",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const COMMUNICATION_RATING_LABELS: Record<CommunicationRating, string> = {
  excellent: "Excellent",
  good: "Good",
  needs_attention: "Needs Attention",
  poor: "Poor",
};

export const MATURITY_LABELS: Record<MaturityLevel, string> = {
  reactive: "Reactive",
  developing: "Developing",
  managed: "Managed",
  optimized: "Optimized",
  strategic: "Strategic",
};

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  strong: "Strong",
  stable: "Stable",
  at_risk: "At Risk",
  critical: "Critical",
};

export const INSUFFICIENT_CLIENT_DATA =
  "Not enough operational data available for this client.";
