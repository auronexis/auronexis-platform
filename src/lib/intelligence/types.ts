import type { HealthStatus } from "@/lib/health/types";

export type PrioritySeverity = "Low" | "Medium" | "High" | "Critical";

export type ClientPriorityResult = {
  clientId: string;
  clientName: string;
  score: number;
  severity: PrioritySeverity;
  reasons: string[];
  recommendedAction: string;
  healthLabel: "healthy" | "watch" | "critical";
  openRisks: number;
  openIncidents: number;
  monthlyRevenue: number;
};

export type ExecutiveBrief = {
  greeting: string;
  firstName: string;
  clientsRequiringAttention: number;
  overdueReportsCount: number;
  criticalIncidentCount: number;
  revenueAtRisk: number;
  revenueAtRiskFormatted: string;
  highestPriorityClient: {
    clientId: string;
    clientName: string;
    score: number;
    severity: PrioritySeverity;
  } | null;
  summaryLines: string[];
};

export type PortfolioHealthBand = "Healthy" | "Watch" | "Risk" | "Critical";

export type PortfolioHealthDistribution = {
  healthy: number;
  watch: number;
  risk: number;
  critical: number;
  total: number;
};

export type ExecutiveInsightTone = "default" | "success" | "warning" | "danger" | "info";

export type ExecutiveInsight = {
  id: string;
  title: string;
  value: string | number;
  description: string;
  href: string;
  tone: ExecutiveInsightTone;
};

export type CustomerSuccessCategory = {
  id: string;
  label: string;
  count: number;
  description: string;
  href: string;
  tone: ExecutiveInsightTone;
};

export type HealthTrendPeriodDays = 7 | 30 | 90;

export type OrganizationHealthTrend = {
  periodDays: HealthTrendPeriodDays;
  label: string;
  averageScore: number | null;
  delta: number | null;
  status: HealthStatus | null;
  points: Array<{ score: number; calculatedAt: string }>;
  hasData: boolean;
};

export type SmartTimelineEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  href: string | null;
  createdAt: string;
  relativeTime: string;
};

export type ExecutiveIntelligence = {
  brief: ExecutiveBrief;
  priorityClients: ClientPriorityResult[];
  portfolioHealth: PortfolioHealthDistribution;
  insights: ExecutiveInsight[];
  successCategories: CustomerSuccessCategory[];
  healthTrends: OrganizationHealthTrend[];
  timeline: SmartTimelineEvent[];
  generatedAt: string;
  hasClients: boolean;
};
