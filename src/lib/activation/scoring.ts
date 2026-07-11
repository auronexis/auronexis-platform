import type {
  ActivationDataSnapshot,
  ActivationReadinessCategory,
  ActivationStage,
  ActivationStepCategory,
  ActivationStepStatus,
} from "@/lib/activation/types";
import { getActivationCategoryLabel } from "@/lib/activation/steps";

const CATEGORY_ORDER: ActivationStepCategory[] = [
  "foundation",
  "operations",
  "collaboration",
  "customer_visibility",
  "commercial",
];

/** First meaningful value: client + operational record (report, risk, or incident). */
export function hasReachedFirstValueMilestone(
  snapshot: ActivationDataSnapshot,
  steps: ActivationStepStatus[],
): boolean {
  const clientStep = steps.find((step) => step.id === "first_client");
  if (!clientStep?.complete) {
    return false;
  }

  const reportComplete = steps.find((step) => step.id === "first_report")?.complete ?? false;
  const operationalComplete =
    steps.find((step) => step.id === "first_risk_or_incident")?.complete ?? false;

  return reportComplete || operationalComplete;
}

export function getApplicableSteps(steps: ActivationStepStatus[]): ActivationStepStatus[] {
  return steps.filter((step) => !step.locked);
}

export function getRequiredApplicableSteps(steps: ActivationStepStatus[]): ActivationStepStatus[] {
  return getApplicableSteps(steps).filter((step) => step.required);
}

export function getCompletionPercent(steps: ActivationStepStatus[]): number {
  const applicable = getApplicableSteps(steps);
  if (applicable.length === 0) {
    return 0;
  }
  const complete = applicable.filter((step) => step.complete).length;
  return Math.round((complete / applicable.length) * 100);
}

export function buildReadinessCategories(steps: ActivationStepStatus[]): ActivationReadinessCategory[] {
  return CATEGORY_ORDER.map((key) => {
    const categorySteps = steps.filter((step) => step.category === key && !step.locked);
    return {
      key,
      label: getActivationCategoryLabel(key),
      completeCount: categorySteps.filter((step) => step.complete).length,
      applicableCount: categorySteps.length,
    };
  }).filter((category) => category.applicableCount > 0);
}

/** Deterministic activation stage from real workspace data. */
export function resolveActivationStage(
  snapshot: ActivationDataSnapshot,
  steps: ActivationStepStatus[],
): ActivationStage {
  const applicable = getApplicableSteps(steps);
  const completeCount = applicable.filter((step) => step.complete).length;
  const percent = getCompletionPercent(steps);
  const firstValue = hasReachedFirstValueMilestone(snapshot, steps);
  const hasClient = snapshot.clientCount > 0;
  const requiredApplicable = getRequiredApplicableSteps(steps);
  const requiredComplete = requiredApplicable.filter((step) => step.complete).length;

  if (completeCount <= 1) {
    return "not_started";
  }

  if (!hasClient) {
    return "getting_started";
  }

  if (!firstValue) {
    return "building_foundation";
  }

  if (requiredComplete < requiredApplicable.length || percent < 55) {
    return "operational";
  }

  if (percent < 80) {
    return "activated";
  }

  return "mature";
}

export function shouldShowBeginnerSurfaces(
  stage: ActivationStage,
  preferences: { onboardingDismissedAt: string | null },
): boolean {
  if (preferences.onboardingDismissedAt && (stage === "activated" || stage === "mature")) {
    return false;
  }
  return stage !== "mature";
}

export function shouldShowWelcome(
  stage: ActivationStage,
  preferences: { welcomeDismissedAt: string | null },
): boolean {
  if (preferences.welcomeDismissedAt) {
    return false;
  }
  return stage === "not_started" || stage === "getting_started";
}

/** Whether the dashboard activation panel should render — independent of progress calculation. */
export function shouldShowActivationPanel(
  stage: ActivationStage,
  preferences: { activationPanelDismissedAt: string | null },
  showBeginnerSurfaces: boolean,
): boolean {
  if (preferences.activationPanelDismissedAt) {
    return false;
  }
  if (stage === "mature") {
    return false;
  }
  return showBeginnerSurfaces;
}

export const FIRST_VALUE_MILESTONE_DESCRIPTION =
  "Create a client, then add a report, risk, or incident to unlock operational intelligence on your dashboard.";
