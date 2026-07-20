/**
 * Business / SaaS lifecycle event catalog — standardized names for product BI.
 * Emitters should use these names via trackAnalyticsEvent / trackServerAnalyticsEvent.
 * Never attach secrets, passwords, API keys, or customer confidential payloads.
 */

export const BUSINESS_EVENTS = [
  "workspace_created",
  "user_invited",
  "user_removed",
  "client_created",
  "client_archived",
  "report_published",
  "risk_created",
  "incident_closed",
  "automation_executed",
  "invoice_paid",
  "subscription_changed",
  "subscription_upgraded",
  "subscription_downgraded",
  "subscription_cancelled",
  "trial_started",
  "trial_ended",
  "portal_login",
  "api_token_created",
  "webhook_connected",
  "integration_connected",
] as const;

export type BusinessEventName = (typeof BUSINESS_EVENTS)[number];

/** Feature modules for adoption telemetry — stable product surface keys. */
export const PRODUCT_MODULES = [
  "dashboard",
  "clients",
  "reports",
  "health",
  "risks",
  "incidents",
  "automation",
  "knowledge",
  "compliance",
  "ai",
  "portal",
  "settings",
  "billing",
  "integrations",
  "white_label",
  "api",
  "marketing",
] as const;

export type ProductModule = (typeof PRODUCT_MODULES)[number];
