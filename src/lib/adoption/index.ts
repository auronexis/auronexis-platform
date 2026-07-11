export type {
  AdoptionStage,
  AdoptionTrend,
  RetentionRiskLevel,
  AdoptionFeatureSignal,
  AdoptionScoreBreakdown,
  RetentionRiskReason,
  AdoptionRecommendation,
  AdoptionDataSnapshot,
  AdoptionSnapshot,
  DashboardGuidanceMode,
} from "@/lib/adoption/types";

export {
  ADOPTION_SCORE_WEIGHTS,
  ADOPTION_FEATURE_REGISTRY,
  MEANINGFUL_ACTIVITY_EVENT_TYPES,
  ADOPTION_STAGE_LABELS,
  ADOPTION_TREND_LABELS,
  RETENTION_RISK_LABELS,
  MAX_ADOPTION_RECOMMENDATIONS,
} from "@/lib/adoption/constants";

export {
  getAdoptionDataSnapshot,
  computeDaysSinceMeaningfulActivity,
  type AdoptionQueryInput,
} from "@/lib/adoption/queries";

export {
  buildFeatureSignals,
  countAdoptedFeatures,
  countAvailableFeatures,
} from "@/lib/adoption/signals";

export { computeAdoptionScore } from "@/lib/adoption/scoring";
export { resolveAdoptionStage, getAdoptionStageGuidance } from "@/lib/adoption/stages";
export { resolveAdoptionTrend } from "@/lib/adoption/trends";
export { assessRetentionRisk } from "@/lib/adoption/risk";
export { buildAdoptionRecommendations } from "@/lib/adoption/recommendations";

export {
  buildAdoptionSnapshot,
  resolveDashboardGuidanceMode,
  summarizeAdoptionForDashboard,
  type BuildAdoptionSnapshotInput,
} from "@/lib/adoption/snapshot";

export {
  buildAdoptionAnalyticsProps,
  adoptionEventToAnalytics,
  type AdoptionAnalyticsEvent,
} from "@/lib/adoption/events";

export {
  recordAdoptionPageViewAction,
  dismissAdoptionSummaryAction,
  type AdoptionActionResult,
} from "@/lib/adoption/actions";

export { getAdoptionPreferences } from "@/lib/adoption/preferences-db";
