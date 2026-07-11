import { ADOPTION_SCORE_WEIGHTS } from "@/lib/adoption/constants";
import type {
  AdoptionDataSnapshot,
  AdoptionFeatureSignal,
  AdoptionScoreBreakdown,
} from "@/lib/adoption/types";
import { computeDaysSinceMeaningfulActivity } from "@/lib/adoption/queries";

type ScoreInput = {
  data: AdoptionDataSnapshot;
  featureSignals: AdoptionFeatureSignal[];
  isActivated: boolean;
  activationCompletionPercent: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreFoundation(input: ScoreInput): number {
  const { data, isActivated, activationCompletionPercent } = input;
  let score = 0;

  if (data.clientCount > 0) {
    score += 6;
  }
  if (isActivated) {
    score += 6;
  }

  const activationBonus = Math.round((activationCompletionPercent / 100) * 8);
  score += activationBonus;

  return clamp(score, 0, ADOPTION_SCORE_WEIGHTS.foundation);
}

function scoreRecurringValue(data: AdoptionDataSnapshot): number {
  let score = 0;

  if (data.valueEvents30d >= 10) {
    score = 20;
  } else if (data.valueEvents30d >= 5) {
    score = 15;
  } else if (data.valueEvents30d >= 2) {
    score = 10;
  } else if (data.valueEvents30d >= 1) {
    score = 5;
  }

  if (data.publishedReports30d >= 2) {
    score += 5;
  } else if (data.publishedReports30d >= 1) {
    score += 3;
  }

  if (data.activeScheduleCount > 0) {
    score += 2;
  }

  return clamp(score, 0, ADOPTION_SCORE_WEIGHTS.recurringValue);
}

function scoreFeatureBreadth(signals: AdoptionFeatureSignal[]): number {
  const available = signals.filter((signal) => signal.available);
  if (available.length === 0) {
    return 0;
  }
  const adopted = available.filter((signal) => signal.adopted).length;
  return Math.round((adopted / available.length) * ADOPTION_SCORE_WEIGHTS.featureBreadth);
}

function scoreEngagementRecency(data: AdoptionDataSnapshot): number {
  const days = computeDaysSinceMeaningfulActivity(data.lastMeaningfulActivityAt);
  if (days === null) {
    return 0;
  }
  if (days <= 3) {
    return ADOPTION_SCORE_WEIGHTS.engagementRecency;
  }
  if (days <= 7) {
    return 12;
  }
  if (days <= 14) {
    return 8;
  }
  if (days <= 30) {
    return 4;
  }
  return 0;
}

function scoreCollaboration(data: AdoptionDataSnapshot): number {
  if (data.activeUsers30d >= 3) {
    return ADOPTION_SCORE_WEIGHTS.collaboration;
  }
  if (data.activeUsers30d >= 2) {
    return 7;
  }
  if (data.teamMemberCount > 1 || data.pendingInvitationCount > 0) {
    return 4;
  }
  return 0;
}

function scoreCustomerVisibility(data: AdoptionDataSnapshot): number {
  let score = 0;
  if (data.publishedReportCount > 0 && data.customerFacingEvents30d > 0) {
    score = ADOPTION_SCORE_WEIGHTS.customerVisibility;
  } else if (data.publishedReportCount > 0) {
    score = 6;
  } else if (data.portalUserCount > 0) {
    score = 4;
  }
  return clamp(score, 0, ADOPTION_SCORE_WEIGHTS.customerVisibility);
}

/** Transparent adoption score from weighted categories — bounded 0–100. */
export function computeAdoptionScore(input: ScoreInput): AdoptionScoreBreakdown {
  const foundation = scoreFoundation(input);
  const recurringValue = scoreRecurringValue(input.data);
  const featureBreadth = scoreFeatureBreadth(input.featureSignals);
  const engagementRecency = scoreEngagementRecency(input.data);
  const collaboration = scoreCollaboration(input.data);
  const customerVisibility = scoreCustomerVisibility(input.data);

  const total = clamp(
    foundation + recurringValue + featureBreadth + engagementRecency + collaboration + customerVisibility,
    0,
    100,
  );

  return {
    foundation,
    recurringValue,
    featureBreadth,
    engagementRecency,
    collaboration,
    customerVisibility,
    total,
  };
}
