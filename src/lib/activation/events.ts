import type { AnalyticsEventName, AnalyticsEventProps } from "@/lib/analytics/events";
import type { ActivationStage } from "@/lib/activation/types";

export type ActivationAnalyticsEvent =
  | "onboarding_viewed"
  | "onboarding_started"
  | "onboarding_dismissed"
  | "onboarding_step_viewed"
  | "onboarding_step_completed"
  | "activation_stage_changed"
  | "activation_milestone_reached"
  | "next_best_action_clicked"
  | "first_client_created"
  | "first_report_created"
  | "first_risk_created"
  | "first_incident_created"
  | "workspace_activated";

export type ActivationAnalyticsProps = AnalyticsEventProps & {
  step_id?: string;
  activation_stage?: ActivationStage;
  completion_percentage?: number;
  source_route?: string;
  plan_key?: string;
  role?: string;
  module?: string;
  locked?: boolean;
  optional?: boolean;
  action_id?: string;
};

const MILESTONE_STORAGE_PREFIX = "auroranexis_activation_milestone_";

/** Build safe analytics props — no PII. */
export function buildActivationAnalyticsProps(
  props: ActivationAnalyticsProps,
): AnalyticsEventProps {
  const safe: AnalyticsEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    safe[key] = value;
  }
  return safe;
}

/** Prevent duplicate milestone events within a browser session. */
export function shouldEmitMilestoneEvent(organizationId: string, milestone: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const key = `${MILESTONE_STORAGE_PREFIX}${organizationId}_${milestone}`;
  if (window.sessionStorage.getItem(key)) {
    return false;
  }
  window.sessionStorage.setItem(key, "1");
  return true;
}

export function activationEventToAnalytics(
  event: ActivationAnalyticsEvent,
): AnalyticsEventName {
  return event as AnalyticsEventName;
}
