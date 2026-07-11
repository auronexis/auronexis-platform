import type { ActivationSnapshot } from "@/lib/activation/types";
import { computeAdoptionScore } from "@/lib/adoption/scoring";
import { buildAdoptionRecommendations } from "@/lib/adoption/recommendations";
import {
  buildFeatureSignals,
  countAdoptedFeatures,
  countAvailableFeatures,
} from "@/lib/adoption/signals";
import { assessRetentionRisk } from "@/lib/adoption/risk";
import { resolveAdoptionStage } from "@/lib/adoption/stages";
import { resolveAdoptionTrend } from "@/lib/adoption/trends";
import {
  computeDaysSinceMeaningfulActivity,
  getAdoptionDataSnapshot,
  type AdoptionQueryInput,
} from "@/lib/adoption/queries";
import type { AdoptionSnapshot, DashboardGuidanceMode } from "@/lib/adoption/types";

export type BuildAdoptionSnapshotInput = AdoptionQueryInput & {
  activation: ActivationSnapshot;
};

/** Primary entry point — compose full adoption snapshot for all surfaces. */
export async function buildAdoptionSnapshot(
  input: BuildAdoptionSnapshotInput,
): Promise<AdoptionSnapshot> {
  const data = await getAdoptionDataSnapshot(input);
  const featureSignals = buildFeatureSignals({
    data,
    session: input.session,
    planContext: input.planContext,
  });

  const adoptedFeatureCount = countAdoptedFeatures(featureSignals);
  const availableFeatureCount = countAvailableFeatures(featureSignals);
  const isActivated = input.activation.firstValueReached;
  const isMature =
    input.activation.stage === "mature" || input.activation.stage === "activated";
  const hasEnoughData = isActivated || data.valueEvents30d + data.valueEventsPrevious30d >= 1;

  const trend = resolveAdoptionTrend({
    valueEvents30d: data.valueEvents30d,
    valueEventsPrevious30d: data.valueEventsPrevious30d,
    isActivated,
  });

  const scoreBreakdown = computeAdoptionScore({
    data,
    featureSignals,
    isActivated,
    activationCompletionPercent: input.activation.completionPercent,
  });

  const stage = resolveAdoptionStage({
    data,
    featureSignals,
    score: scoreBreakdown.total,
    trend,
    isActivated,
    adoptedFeatureCount,
    activeUsers30d: data.activeUsers30d,
  });

  const { level: riskLevel, reasons: riskReasons } = assessRetentionRisk({
    data,
    featureSignals,
    stage,
    trend,
    isActivated,
    hasEnoughData,
    adoptedFeatureCount,
    availableFeatureCount,
  });

  const recommendations = buildAdoptionRecommendations({
    session: input.session,
    data,
    featureSignals,
    activation: input.activation,
    stage,
    riskReasons,
    planContext: input.planContext,
  });

  const daysSinceMeaningfulActivity = computeDaysSinceMeaningfulActivity(
    data.lastMeaningfulActivityAt,
  );

  return {
    organizationId: input.session.organization.id,
    score: scoreBreakdown.total,
    scoreBreakdown,
    stage,
    trend,
    lastMeaningfulActivityAt: data.lastMeaningfulActivityAt,
    daysSinceMeaningfulActivity,
    activeUsers30d: data.activeUsers30d,
    totalUsers: data.totalUsers,
    featureSignals,
    adoptedFeatureCount,
    availableFeatureCount,
    valueEvents30d: data.valueEvents30d,
    valueEventsPrevious30d: data.valueEventsPrevious30d,
    riskLevel,
    riskReasons,
    recommendations,
    isActivated,
    isMature,
    hasEnoughData,
    generatedAt: new Date().toISOString(),
  };
}

/** Dashboard guidance priority — Phase 22 vs Phase 23 surfaces. */
export function resolveDashboardGuidanceMode(
  activation: ActivationSnapshot,
  adoption: AdoptionSnapshot,
): DashboardGuidanceMode {
  const activationIncomplete =
    !activation.firstValueReached ||
    activation.stage === "not_started" ||
    activation.stage === "getting_started" ||
    activation.stage === "building_foundation";

  if (activationIncomplete) {
    return "activation_primary";
  }

  if (
    adoption.riskLevel === "at_risk" ||
    adoption.riskLevel === "critical" ||
    adoption.stage === "at_risk" ||
    adoption.stage === "inactive"
  ) {
    return "adoption_risk";
  }

  if (adoption.stage === "embedded" || activation.stage === "mature") {
    return "adoption_mature";
  }

  return "adoption_summary";
}

export function summarizeAdoptionForDashboard(
  adoption: AdoptionSnapshot,
): Pick<
  AdoptionSnapshot,
  | "score"
  | "stage"
  | "trend"
  | "riskLevel"
  | "recommendations"
  | "valueEvents30d"
  | "daysSinceMeaningfulActivity"
> {
  return {
    score: adoption.score,
    stage: adoption.stage,
    trend: adoption.trend,
    riskLevel: adoption.riskLevel,
    recommendations: adoption.recommendations,
    valueEvents30d: adoption.valueEvents30d,
    daysSinceMeaningfulActivity: adoption.daysSinceMeaningfulActivity,
  };
}
