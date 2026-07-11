import { INACTIVITY_THRESHOLD_DAYS, STALE_ACTIVITY_DAYS } from "@/lib/adoption/constants";
import type {
  AdoptionDataSnapshot,
  AdoptionFeatureSignal,
  AdoptionStage,
  AdoptionTrend,
} from "@/lib/adoption/types";
import { computeDaysSinceMeaningfulActivity } from "@/lib/adoption/queries";

type StageInput = {
  data: AdoptionDataSnapshot;
  featureSignals: AdoptionFeatureSignal[];
  score: number;
  trend: AdoptionTrend;
  isActivated: boolean;
  adoptedFeatureCount: number;
  activeUsers30d: number;
};

/** Deterministic adoption lifecycle stage rules. */
export function resolveAdoptionStage(input: StageInput): AdoptionStage {
  const daysSince = computeDaysSinceMeaningfulActivity(input.data.lastMeaningfulActivityAt);

  if (!input.isActivated && input.data.valueEvents30d === 0) {
    return "inactive";
  }

  if (daysSince !== null && daysSince > INACTIVITY_THRESHOLD_DAYS) {
    return "inactive";
  }

  if (
    input.trend === "declining" &&
    daysSince !== null &&
    daysSince > STALE_ACTIVITY_DAYS &&
    input.data.valueEventsPrevious30d >= 3
  ) {
    return "at_risk";
  }

  if (
    input.score >= 70 &&
    input.adoptedFeatureCount >= 5 &&
    input.activeUsers30d >= 2 &&
    input.data.valueEvents30d >= 5
  ) {
    return "embedded";
  }

  if (
    input.data.valueEvents30d >= 5 &&
    (input.data.activeScheduleCount > 0 || input.data.publishedReports30d >= 2) &&
    daysSince !== null &&
    daysSince <= STALE_ACTIVITY_DAYS
  ) {
    return "operational";
  }

  if (
    input.data.valueEvents30d >= 3 &&
    input.data.distinctActiveWeeks30d >= 2
  ) {
    return "developing_habits";
  }

  if (input.isActivated && input.data.valueEvents30d >= 1 && input.data.valueEvents30d < 5) {
    const breadthRatio =
      input.featureSignals.filter((s) => s.available).length > 0
        ? input.adoptedFeatureCount / input.featureSignals.filter((s) => s.available).length
        : 0;
    if (breadthRatio < 0.4) {
      return "early_adoption";
    }
  }

  if (input.isActivated) {
    return "newly_activated";
  }

  if (daysSince !== null && daysSince > STALE_ACTIVITY_DAYS) {
    return "at_risk";
  }

  return "early_adoption";
}

export function getAdoptionStageGuidance(stage: AdoptionStage): {
  meaning: string;
  nextStep: string;
} {
  const guidance: Record<AdoptionStage, { meaning: string; nextStep: string }> = {
    newly_activated: {
      meaning: "First value is reached but recurring usage is still forming.",
      nextStep: "Repeat report publishing or operational workflows weekly.",
    },
    early_adoption: {
      meaning: "Some product usage exists with limited breadth.",
      nextStep: "Adopt a second value-producing workflow such as risks or scheduling.",
    },
    developing_habits: {
      meaning: "Meaningful actions are spreading across multiple weeks.",
      nextStep: "Add team collaboration and customer-facing delivery.",
    },
    operational: {
      meaning: "Recurring delivery and recent activity are consistent.",
      nextStep: "Broaden feature adoption and automate repeated manual work.",
    },
    embedded: {
      meaning: "Broad adoption, multiple active users, and low retention risk.",
      nextStep: "Maintain cadence and expand advanced modules.",
    },
    at_risk: {
      meaning: "Usage is declining or becoming stale after prior activity.",
      nextStep: "Re-engage with a published report or operational review.",
    },
    inactive: {
      meaning: "No meaningful product activity within the configured threshold.",
      nextStep: "Return to core workflows: clients, reports, or incidents.",
    },
  };
  return guidance[stage];
}
