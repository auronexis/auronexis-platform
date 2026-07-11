export type ExecutiveIntelligenceAnalyticsEvent =
  | "executive_intelligence_viewed"
  | "executive_briefing_generated"
  | "executive_briefing_refreshed"
  | "executive_briefing_fallback_used"
  | "executive_finding_viewed"
  | "executive_evidence_viewed"
  | "executive_action_clicked"
  | "priority_client_opened"
  | "executive_report_draft_created"
  | "ai_narrative_generated"
  | "ai_narrative_failed"
  | "intelligence_period_changed";

export function buildExecutiveIntelligenceAnalyticsProps(
  event: ExecutiveIntelligenceAnalyticsEvent,
  extra?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  return {
    domain: "executive_intelligence",
    event,
    ...extra,
  };
}
