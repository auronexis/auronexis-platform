/** AI Operational Intelligence — shared types. */

export type InsightPriority = "critical" | "high" | "medium" | "low";

export type InsightCategory =
  | "risk"
  | "incident"
  | "sla"
  | "report"
  | "profitability"
  | "customer_health"
  | "activity"
  | "general";

export type InsightConfidenceLabel = "high" | "medium" | "low";

export type CustomerHealthLabel = "healthy" | "watch" | "attention" | "critical";

export type ClientPriorityLabel = "excellent" | "good" | "attention" | "critical";

export type OperationalInsight = {
  id: string;
  title: string;
  description: string;
  reason: string;
  recommendedAction: string;
  relatedClientId: string | null;
  relatedClientName: string | null;
  priority: InsightPriority;
  category: InsightCategory;
  confidence: InsightConfidenceLabel;
  confidenceScore: number;
  timestamp: string;
};

export type OperationalRecommendation = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
};

export type TrendDirection = "up" | "down" | "flat";

export type TrendMetric = {
  id: string;
  label: string;
  current: number;
  previous: number;
  changePercent: number | null;
  direction: TrendDirection;
  unit?: string;
};

export type ClientPriorityEntry = {
  clientId: string;
  clientName: string;
  score: number;
  label: ClientPriorityLabel;
  healthLabel: CustomerHealthLabel;
  factors: string[];
};

export type WorkspaceHealthSummary = {
  score: number;
  label: string;
};

export type OperationalIntelligenceResult = {
  insights: OperationalInsight[];
  recommendations: OperationalRecommendation[];
  trends: TrendMetric[];
  clientRankings: ClientPriorityEntry[];
  workspaceHealth: WorkspaceHealthSummary;
  generatedAt: string;
  hasSufficientData: boolean;
  providerId: string;
  model: string;
  durationMs: number;
};

export type InsightsHistoryEntry = {
  id: string;
  insightCount: number;
  timestamp: string;
  provider: string;
  durationMs: number;
  tokens: number | null;
};

export type InsightsFilterState = {
  clientId: string | null;
  severity: InsightPriority | "all";
  category: InsightCategory | "all";
  dateFrom: string | null;
  dateTo: string | null;
};

export const INSIGHT_PRIORITY_LABELS: Record<InsightPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  risk: "Risk",
  incident: "Incident",
  sla: "SLA",
  report: "Report",
  profitability: "Profitability",
  customer_health: "Customer health",
  activity: "Activity",
  general: "General",
};

export const CLIENT_PRIORITY_LABELS: Record<ClientPriorityLabel, string> = {
  excellent: "Excellent",
  good: "Good",
  attention: "Attention",
  critical: "Critical",
};

export const CUSTOMER_HEALTH_LABELS: Record<CustomerHealthLabel, string> = {
  healthy: "Healthy",
  watch: "Watch",
  attention: "Attention",
  critical: "Critical",
};

export const EMPTY_INSIGHTS_MESSAGE = "Your workspace looks healthy.";
export const INSUFFICIENT_DATA_MESSAGE = "Not enough operational data available.";
