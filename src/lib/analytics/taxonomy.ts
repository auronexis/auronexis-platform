/** Unified analytics taxonomy — snake_case event names grouped by product domain. */

export const ANALYTICS_EVENT_CATEGORIES = [
  "authentication",
  "workspace",
  "clients",
  "reports",
  "risks",
  "incidents",
  "billing",
  "ai",
  "integrations",
  "documentation",
  "marketing",
  "adoption",
] as const;

export type AnalyticsEventCategory = (typeof ANALYTICS_EVENT_CATEGORIES)[number];

/** Conversion funnel events — routed to marketing consent (GA4) when configured. */
export const CONVERSION_EVENTS = [
  "landing_page_view",
  "pricing_view",
  "signup_started",
  "signup_completed",
  "workspace_created",
  "subscription_checkout_started",
  "subscription_checkout_completed",
  "subscription_checkout_cancelled",
  "invoice_paid",
  "invoice_failed",
  "subscription_upgraded",
  "subscription_downgraded",
  "subscription_cancelled",
] as const;

export type ConversionEventName = (typeof CONVERSION_EVENTS)[number];

/** Core product usage events. */
export const PRODUCT_EVENTS = [
  "client_created",
  "report_generated",
  "report_published",
  "risk_created",
  "incident_created",
  "dashboard_loaded",
  "ai_summary_generated",
  "integration_connected",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

/** Adoption and retention signals — no PII, no workspace identifiers. */
export const ADOPTION_EVENTS = [
  "activation_completed",
  "feature_adopted",
  "workspace_reengaged",
  "retention_signal",
  "expansion_signal",
  "workspace_health_viewed",
] as const;

export type AdoptionEventName = (typeof ADOPTION_EVENTS)[number];

const EVENT_CATEGORY_MAP: Record<string, AnalyticsEventCategory> = {
  page_view: "marketing",
  landing_page_view: "marketing",
  pricing_view: "marketing",
  pricing_viewed: "marketing",
  signup_started: "authentication",
  signup_completed: "authentication",
  login_completed: "authentication",
  workspace_created: "workspace",
  workspace_activated: "workspace",
  dashboard_loaded: "workspace",
  onboarding_viewed: "workspace",
  onboarding_started: "workspace",
  onboarding_dismissed: "workspace",
  onboarding_step_viewed: "workspace",
  onboarding_step_completed: "workspace",
  activation_stage_changed: "workspace",
  activation_milestone_reached: "workspace",
  next_best_action_clicked: "workspace",
  first_client_created: "clients",
  first_report_created: "reports",
  first_risk_created: "risks",
  first_incident_created: "incidents",
  activation_panel_dismissed: "workspace",
  client_created: "clients",
  report_created: "reports",
  report_generated: "reports",
  report_published: "reports",
  risk_created: "risks",
  incident_created: "incidents",
  subscription_checkout_started: "billing",
  subscription_checkout_completed: "billing",
  subscription_checkout_cancelled: "billing",
  checkout_started: "billing",
  checkout_completed: "billing",
  plan_selected: "billing",
  billing_portal_opened: "billing",
  invoice_paid: "billing",
  invoice_failed: "billing",
  subscription_upgraded: "billing",
  subscription_downgraded: "billing",
  subscription_cancelled: "billing",
  subscription_changed: "billing",
  trial_started: "billing",
  trial_ended: "billing",
  portal_viewed: "clients",
  portal_login: "clients",
  client_archived: "clients",
  incident_closed: "incidents",
  automation_executed: "workspace",
  user_invited: "workspace",
  user_removed: "workspace",
  api_token_created: "integrations",
  webhook_connected: "integrations",
  features_page_viewed: "marketing",
  ai_summary_generated: "ai",
  ai_summary_generation_started: "ai",
  ai_summary_generation_succeeded: "ai",
  ai_summary_generation_failed: "ai",
  ai_summary_saved: "ai",
  ai_connection_test_started: "integrations",
  ai_connection_test_succeeded: "integrations",
  ai_connection_test_failed: "integrations",
  integration_connected: "integrations",
  docs_viewed: "documentation",
  documentation_viewed: "documentation",
  activation_completed: "adoption",
  feature_adopted: "adoption",
  workspace_reengaged: "adoption",
  retention_signal: "adoption",
  expansion_signal: "adoption",
  workspace_health_viewed: "adoption",
  adoption_page_viewed: "adoption",
  adoption_score_viewed: "adoption",
  adoption_recommendation_clicked: "adoption",
  adoption_stage_changed: "adoption",
  adoption_trend_changed: "adoption",
  retention_risk_detected: "adoption",
  retention_risk_resolved: "adoption",
  adoption_summary_viewed: "adoption",
};

/** Resolve the taxonomy category for an event name. */
export function getEventCategory(eventName: string): AnalyticsEventCategory {
  return EVENT_CATEGORY_MAP[eventName] ?? "marketing";
}

/** Legacy event names mapped to canonical snake_case equivalents. */
export const LEGACY_EVENT_ALIASES: Record<string, string> = {
  pricing_viewed: "pricing_view",
  checkout_started: "subscription_checkout_started",
  checkout_completed: "subscription_checkout_completed",
  organic_landing_view: "landing_page_view",
  ai_summary_generation_succeeded: "ai_summary_generated",
  report_created: "report_generated",
  docs_viewed: "documentation_viewed",
  portal_viewed: "portal_login",
};

export function resolveCanonicalEventName(eventName: string): string {
  return LEGACY_EVENT_ALIASES[eventName] ?? eventName;
}

export function isConversionEvent(eventName: string): boolean {
  const canonical = resolveCanonicalEventName(eventName);
  return (CONVERSION_EVENTS as readonly string[]).includes(canonical);
}

export function isProductEvent(eventName: string): boolean {
  const canonical = resolveCanonicalEventName(eventName);
  return (PRODUCT_EVENTS as readonly string[]).includes(canonical);
}
