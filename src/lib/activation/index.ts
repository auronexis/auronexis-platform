export type {
  ActivationStage,
  ActivationStepCategory,
  ActivationStepId,
  ActivationStepStatus,
  ActivationReadinessCategory,
  NextBestAction,
  ActivationPreferences,
  ActivationDataSnapshot,
  ActivationSnapshot,
} from "@/lib/activation/types";

export { ACTIVATION_STEP_DEFINITIONS, buildActivationSteps, getActivationCategoryLabel } from "@/lib/activation/steps";
export {
  getCompletionPercent,
  hasReachedFirstValueMilestone,
  resolveActivationStage,
  shouldShowBeginnerSurfaces,
  shouldShowWelcome,
  shouldShowActivationPanel,
  FIRST_VALUE_MILESTONE_DESCRIPTION,
  buildReadinessCategories,
} from "@/lib/activation/scoring";
export {
  getActivationDataSnapshot,
  type ActivationQueryInput,
} from "@/lib/activation/queries";
export { getActivationPreferences } from "@/lib/activation/preferences-db";
export { buildActivationSnapshot, summarizeActivationForDashboard } from "@/lib/activation/status";
export { buildNextBestAction } from "@/lib/activation/recommendations";
export {
  dismissActivationSurfaceAction,
  dismissActivationPanelAction,
  recordOnboardingViewAction,
  recordActivationMilestoneAction,
  type ActivationActionState,
} from "@/lib/activation/actions";
export { ACTIVATION_CTA_PRESETS, type ActivationCtaPreset, type ActivationCtaPresetKey } from "@/lib/activation/cta";
export {
  activationEventToAnalytics,
  buildActivationAnalyticsProps,
  shouldEmitMilestoneEvent,
  type ActivationAnalyticsEvent,
} from "@/lib/activation/events";
