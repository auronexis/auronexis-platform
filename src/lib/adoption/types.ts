import type { PlanFeatureKey } from "@/lib/plans/types";
import type { Permission } from "@/lib/authorization/permissions";

export type AdoptionStage =
  | "newly_activated"
  | "early_adoption"
  | "developing_habits"
  | "operational"
  | "embedded"
  | "at_risk"
  | "inactive";

export type AdoptionTrend = "improving" | "stable" | "declining" | "insufficient_data";

export type RetentionRiskLevel = "healthy" | "watch" | "at_risk" | "critical" | "unknown";

export type AdoptionFeatureImportance = "core" | "recommended" | "advanced";

export type AdoptionFeatureSignal = {
  key: string;
  label: string;
  category: string;
  available: boolean;
  adopted: boolean;
  firstUsedAt: string | null;
  lastUsedAt: string | null;
  usageCount30d: number;
  importance: AdoptionFeatureImportance;
  route: string | null;
};

export type AdoptionScoreBreakdown = {
  foundation: number;
  recurringValue: number;
  featureBreadth: number;
  engagementRecency: number;
  collaboration: number;
  customerVisibility: number;
  total: number;
};

export type RetentionRiskReason = {
  code: string;
  label: string;
  description: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  recommendedActionKey: string | null;
};

export type AdoptionRecommendation = {
  key: string;
  title: string;
  description: string;
  priority: number;
  route: string;
  ctaLabel: string;
  reason: string;
  category: string;
  available: boolean;
  permitted: boolean;
};

export type AdoptionDataSnapshot = {
  clientCount: number;
  reportCount: number;
  publishedReportCount: number;
  publishedReports30d: number;
  reportScheduleCount: number;
  activeScheduleCount: number;
  riskCount: number;
  openRiskCount: number;
  incidentCount: number;
  openIncidentCount: number;
  monitoringConnectorCount: number;
  monitoringEvents30d: number;
  automationWorkflowCount: number;
  automationExecutions30d: number;
  knowledgeItemCount: number;
  teamMemberCount: number;
  pendingInvitationCount: number;
  portalUserCount: number;
  slaPolicyCount: number;
  profitabilityRecordCount: number;
  valueEvents30d: number;
  valueEventsPrevious30d: number;
  lastMeaningfulActivityAt: string | null;
  activeUsers30d: number;
  totalUsers: number;
  distinctActiveWeeks30d: number;
  customerFacingEvents30d: number;
  features: {
    risks: boolean;
    incidents: boolean;
    sla: boolean;
    customerPortal: boolean;
    profitability: boolean;
    scheduling: boolean;
    automation: boolean;
    knowledge: boolean;
    monitoring: boolean;
  };
};

export type AdoptionSnapshot = {
  organizationId: string;
  score: number;
  scoreBreakdown: AdoptionScoreBreakdown;
  stage: AdoptionStage;
  trend: AdoptionTrend;
  lastMeaningfulActivityAt: string | null;
  daysSinceMeaningfulActivity: number | null;
  activeUsers30d: number;
  totalUsers: number;
  featureSignals: AdoptionFeatureSignal[];
  adoptedFeatureCount: number;
  availableFeatureCount: number;
  valueEvents30d: number;
  valueEventsPrevious30d: number;
  riskLevel: RetentionRiskLevel;
  riskReasons: RetentionRiskReason[];
  recommendations: AdoptionRecommendation[];
  isActivated: boolean;
  isMature: boolean;
  hasEnoughData: boolean;
  generatedAt: string;
};

export type AdoptionFeatureDefinition = {
  key: string;
  label: string;
  category: string;
  importance: AdoptionFeatureImportance;
  route: string | null;
  planFeature: PlanFeatureKey | null;
  requiredPermission: Permission | null;
};

export type DashboardGuidanceMode =
  | "activation_primary"
  | "adoption_risk"
  | "adoption_summary"
  | "adoption_mature";
