import type { AnalyticsEventName, AnalyticsEventProps } from "@/lib/analytics/events";
import type { AdoptionSnapshot } from "@/lib/adoption/types";

export type AdoptionAnalyticsPropKey =
  | "adoption_stage"
  | "adoption_score"
  | "adoption_trend"
  | "risk_level"
  | "recommendation_key"
  | "feature_key"
  | "source_route"
  | "value_events_30d"
  | "active_users_30d"
  | "plan_key"
  | "role";

/** Build consent-safe adoption analytics props — no PII. */
export function buildAdoptionAnalyticsProps(
  snapshot: AdoptionSnapshot,
  extra?: AnalyticsEventProps,
): AnalyticsEventProps {
  return {
    adoption_stage: snapshot.stage,
    adoption_score: snapshot.score,
    adoption_trend: snapshot.trend,
    risk_level: snapshot.riskLevel,
    value_events_30d: snapshot.valueEvents30d,
    active_users_30d: snapshot.activeUsers30d,
    ...extra,
  };
}

export type AdoptionAnalyticsEvent =
  | "adoption_page_viewed"
  | "adoption_score_viewed"
  | "adoption_recommendation_clicked"
  | "adoption_stage_changed"
  | "adoption_trend_changed"
  | "retention_risk_detected"
  | "retention_risk_resolved"
  | "feature_adopted"
  | "workspace_reengaged"
  | "adoption_summary_viewed";

export function adoptionEventToAnalytics(
  event: AdoptionAnalyticsEvent,
  snapshot: AdoptionSnapshot,
  extra?: AnalyticsEventProps,
): { event: AnalyticsEventName; props: AnalyticsEventProps } {
  return {
    event: event as AnalyticsEventName,
    props: buildAdoptionAnalyticsProps(snapshot, extra),
  };
}
