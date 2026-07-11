import { INACTIVITY_THRESHOLD_DAYS, STALE_ACTIVITY_DAYS } from "@/lib/adoption/constants";
import type {
  AdoptionDataSnapshot,
  AdoptionFeatureSignal,
  AdoptionStage,
  AdoptionTrend,
  RetentionRiskLevel,
  RetentionRiskReason,
} from "@/lib/adoption/types";
import { computeDaysSinceMeaningfulActivity } from "@/lib/adoption/queries";

type RiskInput = {
  data: AdoptionDataSnapshot;
  featureSignals: AdoptionFeatureSignal[];
  stage: AdoptionStage;
  trend: AdoptionTrend;
  isActivated: boolean;
  hasEnoughData: boolean;
  adoptedFeatureCount: number;
  availableFeatureCount: number;
};

function buildRiskReasons(input: RiskInput): RetentionRiskReason[] {
  const reasons: RetentionRiskReason[] = [];
  const daysSince = computeDaysSinceMeaningfulActivity(input.data.lastMeaningfulActivityAt);

  if (!input.isActivated) {
    reasons.push({
      code: "incomplete_activation",
      label: "Activation incomplete",
      description: "First meaningful product value has not been reached.",
      severity: "medium",
      evidence: "No first-value milestone detected.",
      recommendedActionKey: "complete_activation",
    });
  }

  if (daysSince !== null && daysSince > INACTIVITY_THRESHOLD_DAYS) {
    reasons.push({
      code: "no_recent_activity",
      label: "No recent activity",
      description: "No meaningful product activity within the inactivity threshold.",
      severity: "high",
      evidence: `${daysSince} days since last meaningful activity.`,
      recommendedActionKey: "re_engage",
    });
  } else if (daysSince !== null && daysSince > STALE_ACTIVITY_DAYS) {
    reasons.push({
      code: "stale_activity",
      label: "Stale activity",
      description: "Meaningful usage has slowed beyond the healthy window.",
      severity: "medium",
      evidence: `${daysSince} days since last meaningful activity.`,
      recommendedActionKey: "re_engage",
    });
  }

  if (input.data.publishedReportCount === 0 && input.isActivated) {
    reasons.push({
      code: "no_published_report",
      label: "No published report",
      description: "Customer delivery value requires at least one published report.",
      severity: "medium",
      evidence: "Zero published reports in workspace.",
      recommendedActionKey: "publish_report",
    });
  }

  if (input.data.valueEvents30d === 0 && input.data.valueEventsPrevious30d > 0) {
    reasons.push({
      code: "no_recurring_value",
      label: "No recurring value",
      description: "No meaningful value events in the current 30-day window.",
      severity: "high",
      evidence: "Current period has zero value events after prior usage.",
      recommendedActionKey: "re_engage",
    });
  }

  if (input.data.teamMemberCount <= 1 && input.data.activeUsers30d <= 1) {
    reasons.push({
      code: "single_user_dependency",
      label: "Single-user dependency",
      description: "Workspace activity depends on one user.",
      severity: "medium",
      evidence: "One team member with sole recent activity.",
      recommendedActionKey: "invite_teammate",
    });
  }

  if (input.trend === "declining") {
    reasons.push({
      code: "declining_engagement",
      label: "Declining engagement",
      description: "Meaningful activity is decreasing versus the prior period.",
      severity: "medium",
      evidence: "30-day value events declined more than 20%.",
      recommendedActionKey: "re_engage",
    });
  }

  if (input.data.customerFacingEvents30d === 0 && input.data.publishedReportCount > 0) {
    reasons.push({
      code: "no_customer_delivery",
      label: "No customer-facing delivery",
      description: "Published reports exist but no customer-facing activity recently.",
      severity: "low",
      evidence: "No portal or published delivery events in 30 days.",
      recommendedActionKey: "activate_portal",
    });
  }

  if (input.data.teamMemberCount <= 1) {
    reasons.push({
      code: "no_collaboration",
      label: "No team collaboration",
      description: "Workspace has not expanded beyond a single member.",
      severity: "low",
      evidence: "Only one team member.",
      recommendedActionKey: "invite_teammate",
    });
  }

  const unusedCore = input.featureSignals.filter(
    (signal) =>
      signal.available &&
      !signal.adopted &&
      signal.importance === "core",
  );
  if (unusedCore.length > 0 && input.isActivated) {
    reasons.push({
      code: "unused_core_capability",
      label: "Core capability unused",
      description: "An available core feature has not been adopted.",
      severity: "low",
      evidence: `${unusedCore.length} core feature(s) remain unused.`,
      recommendedActionKey: unusedCore[0]?.key ?? null,
    });
  }

  if (
    input.stage === "inactive" &&
    input.data.valueEventsPrevious30d >= 3
  ) {
    reasons.push({
      code: "previously_active_dormant",
      label: "Previously active, now dormant",
      description: "Organization had meaningful usage but is now inactive.",
      severity: "high",
      evidence: "Prior period had recurring value events.",
      recommendedActionKey: "re_engage",
    });
  }

  return reasons;
}

/** Evidence-based retention risk assessment — no PII in evidence strings. */
export function assessRetentionRisk(input: RiskInput): {
  level: RetentionRiskLevel;
  reasons: RetentionRiskReason[];
} {
  if (!input.hasEnoughData) {
    return { level: "unknown", reasons: [] };
  }

  const reasons = buildRiskReasons(input);
  const highCount = reasons.filter((r) => r.severity === "high").length;
  const mediumCount = reasons.filter((r) => r.severity === "medium").length;

  if (input.stage === "inactive" || highCount >= 2) {
    return { level: "critical", reasons };
  }
  if (input.stage === "at_risk" || highCount >= 1) {
    return { level: "at_risk", reasons };
  }
  if (mediumCount >= 2 || input.trend === "declining") {
    return { level: "watch", reasons };
  }
  if (reasons.length === 0) {
    return { level: "healthy", reasons: [] };
  }
  if (mediumCount >= 1) {
    return { level: "watch", reasons };
  }
  return { level: "healthy", reasons };
}
