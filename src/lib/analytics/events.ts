import { canTrackEvent } from "@/lib/analytics/consent-gate";
import { resolveFunnelStage } from "@/lib/analytics/funnel";
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
  | "subscription_checkout_cancelled"
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
  | "portal_login"
  | "docs_viewed"
  | "legal_page_viewed"
  | "client_created"
  | "client_archived"
  | "report_created"
  | "report_generated"
  | "report_published"
  | "risk_created"
  | "incident_created"
  | "incident_closed"
  | "automation_executed"
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
  | "features_page_viewed"
  | "ai_connection_test_started"
  | "ai_connection_test_succeeded"
  | "ai_connection_test_failed"
  | "ai_summary_generation_started"
  | "ai_summary_generation_succeeded"
  | "ai_summary_generation_failed"
  | "ai_summary_saved"
  | "ai_rate_limit_reached"
  | "user_invited"
  | "user_removed"
  | "api_token_created"
  | "webhook_connected"
  | "trial_started"
  | "trial_ended"
  | "subscription_changed";

export type AnalyticsEventProps = Record<string, string | number | boolean>;

export type AnalyticsSinkConsent = "analytics" | "marketing";

type AnalyticsSink = (name: AnalyticsEventName, props?: AnalyticsEventProps) => void;

type RegisteredSink = {
  consent: AnalyticsSinkConsent;
  capture: AnalyticsSink;
};

const sinks: RegisteredSink[] = [];
const recentEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 400;

/** Register a runtime analytics sink with an explicit consent category. */
export function registerAnalyticsSink(
  sink: AnalyticsSink,
  consent: AnalyticsSinkConsent = "analytics",
): void {
  sinks.push({ consent, capture: sink });
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
 * Standard envelope adds event_category, optional funnel_stage, feature/module when provided.
 */
export function trackAnalyticsEvent(
  name: AnalyticsEventName,
  props?: AnalyticsEventProps,
): void {
  if (typeof window === "undefined" || !isProductionAnalyticsRuntime()) return;
  if (shouldDedupeEvent(name, props)) return;

  const canonicalName = resolveCanonicalEventName(name) as AnalyticsEventName;
  const category = getEventCategory(canonicalName);
  const funnelStage = resolveFunnelStage(canonicalName);
  const enrichedProps: AnalyticsEventProps = {
    ...sanitizeEventProps(props),
    event_category: category,
  };

  if (funnelStage && enrichedProps.funnel_stage === undefined) {
    enrichedProps.funnel_stage = funnelStage;
  }

  const canTrackAnalytics = canTrackEvent("analytics");
  const canTrackMarketing = canTrackEvent("marketing");

  if (!canTrackAnalytics && !canTrackMarketing) return;

  for (const sink of sinks) {
    try {
      if (sink.consent === "marketing" && !canTrackMarketing) continue;
      if (sink.consent === "analytics" && !canTrackAnalytics) continue;
      sink.capture(canonicalName, enrichedProps);
    } catch {
      // Analytics must never break the app.
    }
  }
}

/** Exact keys that must never leave the browser via analytics sinks. */
const BLOCKED_PROP_KEYS = new Set([
  "email",
  "name",
  "full_name",
  "phone",
  "address",
  "password",
  "token",
  "secret",
  "api_key",
  "apikey",
  "access_token",
  "refresh_token",
  "organization_id",
  "organizationid",
  "workspace_id",
  "workspaceid",
  "user_id",
  "userid",
  "session_id",
  "sessionid",
  "client_id",
  "clientid",
  "customer_id",
  "customerid",
  "subscription_id",
  "subscriptionid",
  "invoice_id",
  "invoiceid",
  "stripe_customer_id",
  "paddle_customer_id",
  "prompt",
  "completion",
  "message",
  "body",
]);

function isBlockedPropKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  if (BLOCKED_PROP_KEYS.has(normalized)) return true;
  if (normalized.endsWith("_email") || normalized.endsWith("_password")) return true;
  if (normalized.includes("api_key") || normalized.includes("secret")) return true;
  if (normalized.includes("password") || normalized.includes("access_token")) return true;
  return false;
}

function sanitizeEventProps(props?: AnalyticsEventProps): AnalyticsEventProps | undefined {
  if (!props) return undefined;

  const safe: AnalyticsEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (isBlockedPropKey(key)) continue;
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
