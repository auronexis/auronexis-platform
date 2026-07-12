import { canTrackEvent } from "@/lib/analytics/consent-gate";
import { isProductionAnalyticsRuntime } from "@/lib/analytics/runtime";
import {
  getEventCategory,
  resolveCanonicalEventName,
} from "@/lib/analytics/taxonomy";

/** Supported conversion and product analytics events. */
export type AnalyticsEventName =
  | "page_view"
  | "landing_page_view"
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "workspace_created"
  | "pricing_view"
  | "pricing_viewed"
  | "plan_selected"
  | "subscription_checkout_started"
  | "subscription_checkout_completed"
  | "checkout_started"
  | "checkout_completed"
  | "billing_portal_opened"
  | "invoice_paid"
  | "invoice_failed"
  | "subscription_upgraded"
  | "subscription_downgraded"
  | "subscription_cancelled"
  | "contact_clicked"
  | "support_clicked"
  | "demo_requested"
  | "cta_clicked"
  | "enterprise_page_viewed"
  | "portal_viewed"
  | "docs_viewed"
  | "legal_page_viewed"
  | "client_created"
  | "report_created"
  | "report_generated"
  | "report_published"
  | "risk_created"
  | "incident_created"
  | "dashboard_loaded"
  | "integration_connected"
  | "ai_summary_generated"
  | "onboarding_viewed"
  | "onboarding_started"
  | "onboarding_dismissed"
  | "onboarding_step_viewed"
  | "onboarding_step_completed"
  | "activation_stage_changed"
  | "activation_milestone_reached"
  | "activation_completed"
  | "next_best_action_clicked"
  | "first_client_created"
  | "first_report_created"
  | "first_risk_created"
  | "first_incident_created"
  | "workspace_activated"
  | "activation_panel_dismissed"
  | "adoption_page_viewed"
  | "adoption_score_viewed"
  | "adoption_recommendation_clicked"
  | "adoption_stage_changed"
  | "adoption_trend_changed"
  | "retention_risk_detected"
  | "retention_risk_resolved"
  | "retention_signal"
  | "expansion_signal"
  | "feature_adopted"
  | "workspace_reengaged"
  | "workspace_health_viewed"
  | "adoption_summary_viewed"
  | "customer_success_page_viewed"
  | "client_success_viewed"
  | "success_playbook_suggested"
  | "success_playbook_started"
  | "success_playbook_assigned"
  | "success_playbook_completed"
  | "success_playbook_cancelled"
  | "success_task_started"
  | "success_task_completed"
  | "success_task_overdue"
  | "client_health_changed"
  | "client_recovery_detected"
  | "client_recovery_failed"
  | "customer_success_summary_viewed"
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
  | "intelligence_period_changed"
  | "organic_landing_view"
  | "pricing_cta_clicked"
  | "contact_sales_clicked"
  | "documentation_viewed"
  | "ai_connection_test_started"
  | "ai_connection_test_succeeded"
  | "ai_connection_test_failed"
  | "ai_summary_generation_started"
  | "ai_summary_generation_succeeded"
  | "ai_summary_generation_failed"
  | "ai_summary_saved"
  | "ai_rate_limit_reached";

export type AnalyticsEventProps = Record<string, string | number | boolean>;

type AnalyticsSink = (name: AnalyticsEventName, props?: AnalyticsEventProps) => void;

const sinks: AnalyticsSink[] = [];
const recentEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 400;

/** Register a runtime analytics sink (Plausible, PostHog, etc.). */
export function registerAnalyticsSink(sink: AnalyticsSink): void {
  sinks.push(sink);
}

function shouldDedupeEvent(name: AnalyticsEventName, props?: AnalyticsEventProps): boolean {
  const signature = `${resolveCanonicalEventName(name)}:${props?.path ?? ""}:${props?.surface ?? ""}`;
  const now = Date.now();
  const last = recentEvents.get(signature);
  if (last && now - last < DEDUPE_WINDOW_MS) {
    return true;
  }
  recentEvents.set(signature, now);
  return false;
}

/**
 * Track a privacy-aware analytics event.
 * Never sends personal data — only safe metadata props.
 */
export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps,
): void {
  if (typeof window === "undefined" || !isProductionAnalyticsRuntime()) return;
  if (shouldDedupeEvent(name, props)) return;

  const canonicalName = resolveCanonicalEventName(name) as AnalyticsEventName;
  const category = getEventCategory(canonicalName);
  const enrichedProps: AnalyticsEventProps = {
    ...sanitizeEventProps(props),
    event_category: category,
  };

  const canTrackAnalytics = canTrackEvent("analytics");
  const canTrackMarketing = canTrackEvent("marketing");

  if (!canTrackAnalytics && !canTrackMarketing) return;

  for (const sink of sinks) {
    try {
      if (sink === ga4Sink && !canTrackMarketing) continue;
      if (sink !== ga4Sink && !canTrackAnalytics) continue;
      sink(canonicalName, enrichedProps);
    } catch {
      // Analytics must never break the app.
    }
  }
}

const BLOCKED_PROP_KEYS =
  /email|name|phone|address|password|token|secret|workspace|organization|client_id|customer|stripe|api_key|session_id|subscription_id|invoice_id/i;

function sanitizeEventProps(props?: AnalyticsEventProps): AnalyticsEventProps | undefined {
  if (!props) return undefined;

  const safe: AnalyticsEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (BLOCKED_PROP_KEYS.test(key)) continue;
    if (typeof value === "string" && value.includes("@")) continue;
    safe[key] = value;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

/** Plausible-compatible custom event sink. */
export function plausibleSink(name: string, props?: AnalyticsEventProps): void {
  const plausible = (window as Window & { plausible?: (event: string, options?: { props?: AnalyticsEventProps }) => void }).plausible;
  if (!plausible) return;
  plausible(name, props ? { props } : undefined);
}

/** PostHog capture sink — only active when PostHog is initialized. */
export function posthogSink(name: string, props?: AnalyticsEventProps): void {
  const posthog = (window as Window & { posthog?: { capture: (event: string, props?: AnalyticsEventProps) => void } }).posthog;
  if (!posthog?.capture) return;
  posthog.capture(name, props);
}

/** GA4 gtag sink — manual page views to avoid duplicate automatic page_view. */
export function ga4Sink(name: string, props?: AnalyticsEventProps): void {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  if (name === "page_view" && props?.path) {
    gtag("event", "page_view", {
      page_path: props.path,
      page_location: window.location.href.split("?")[0],
      ...props,
    });
    return;
  }

  gtag("event", name, props);
}

/** Track a canonical conversion event. */
export function trackConversionEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps,
): void {
  trackAnalyticsEvent(name, { ...props, funnel: "conversion" });
}

/** Track a canonical product analytics event. */
export function trackProductEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps,
): void {
  trackAnalyticsEvent(name, { ...props, funnel: "product" });
}
