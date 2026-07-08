export { getExecutiveIntelligence } from "@/lib/intelligence/queries";
export {
  buildCustomerSuccessCategories,
  buildExecutiveBrief,
  buildExecutiveInsights,
  buildPriorityClientSummaries,
  buildSmartTimeline,
} from "@/lib/intelligence/recommendations";
export {
  buildPortfolioHealthDistribution,
  calculateClientPriority,
  isClientRequiringAttention,
  isReportOverdue,
  rankClientPriorities,
  severityFromScore,
} from "@/lib/intelligence/scoring";
export type {
  ClientPriorityResult,
  CustomerSuccessCategory,
  ExecutiveBrief,
  ExecutiveInsight,
  ExecutiveIntelligence,
  HealthTrendPeriodDays,
  OrganizationHealthTrend,
  PortfolioHealthBand,
  PortfolioHealthDistribution,
  PrioritySeverity,
  SmartTimelineEvent,
} from "@/lib/intelligence/types";
