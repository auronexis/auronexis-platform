import type { ActivationDataSnapshot, ActivationSnapshot, ActivationStepStatus } from "@/lib/activation/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import { buildActivationSteps } from "@/lib/activation/steps";
import {
  buildReadinessCategories,
  FIRST_VALUE_MILESTONE_DESCRIPTION,
  getApplicableSteps,
  getCompletionPercent,
  getRequiredApplicableSteps,
  hasReachedFirstValueMilestone,
  resolveActivationStage,
  shouldShowBeginnerSurfaces,
  shouldShowWelcome,
  shouldShowActivationPanel,
} from "@/lib/activation/scoring";
import { buildNextBestAction } from "@/lib/activation/recommendations";
import {
  getActivationDataSnapshot,
  type ActivationQueryInput,
} from "@/lib/activation/queries";
import { getActivationPreferences } from "@/lib/activation/preferences-db";

export type BuildActivationSnapshotInput = {
  session: SessionContext;
  planContext: OrganizationPlanContext | null;
  teamMemberCount: number;
  pendingInvitationCount: number;
  knowledgeHub: KnowledgeHubData | null;
  openRiskCount?: number;
  monitoringConnectorCount?: number;
};

/** Compose the full activation snapshot for dashboard and onboarding surfaces. */
export async function buildActivationSnapshot(
  input: BuildActivationSnapshotInput,
): Promise<ActivationSnapshot> {
  const [preferences, dataSnapshot] = await Promise.all([
    getActivationPreferences(input.session.organization.id),
    getActivationDataSnapshot(input),
  ]);

  const steps = buildActivationSteps(
    dataSnapshot,
    input.session,
    input.planContext?.features ?? null,
  );
  const applicable = getApplicableSteps(steps);
  const requiredApplicable = getRequiredApplicableSteps(steps);
  const stage = resolveActivationStage(dataSnapshot, steps);
  const firstValueReached = hasReachedFirstValueMilestone(dataSnapshot, steps);
  const showBeginnerSurfaces = shouldShowBeginnerSurfaces(stage, preferences);
  const showWelcome = shouldShowWelcome(stage, preferences);
  const showActivationPanel = shouldShowActivationPanel(stage, preferences, showBeginnerSurfaces);

  return {
    stage,
    completionPercent: getCompletionPercent(steps),
    applicableStepCount: applicable.length,
    completedStepCount: applicable.filter((step) => step.complete).length,
    requiredStepCount: requiredApplicable.length,
    completedRequiredCount: requiredApplicable.filter((step) => step.complete).length,
    firstValueReached,
    showBeginnerSurfaces,
    showWelcome,
    showActivationPanel,
    showOnboardingHub: showBeginnerSurfaces || !preferences.onboardingDismissedAt,
    steps,
    categories: buildReadinessCategories(steps),
    nextBestAction: buildNextBestAction({
      session: input.session,
      snapshot: dataSnapshot,
      steps,
      stage,
      planContext: input.planContext,
    }),
    preferences,
    milestoneDescription: FIRST_VALUE_MILESTONE_DESCRIPTION,
  };
}

export function summarizeActivationForDashboard(
  activation: ActivationSnapshot,
): Pick<
  ActivationSnapshot,
  | "stage"
  | "completionPercent"
  | "showBeginnerSurfaces"
  | "showWelcome"
  | "nextBestAction"
  | "firstValueReached"
  | "milestoneDescription"
> {
  return {
    stage: activation.stage,
    completionPercent: activation.completionPercent,
    showBeginnerSurfaces: activation.showBeginnerSurfaces,
    showWelcome: activation.showWelcome,
    nextBestAction: activation.nextBestAction,
    firstValueReached: activation.firstValueReached,
    milestoneDescription: activation.milestoneDescription,
  };
}

export type { ActivationQueryInput, ActivationDataSnapshot, ActivationStepStatus };
