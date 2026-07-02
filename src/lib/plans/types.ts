import type { PlanKey } from "@/lib/billing/plans";

export type PlanFeatureKey =
  | "reports"
  | "pdf_export"
  | "customer_portal"
  | "activity_feed"
  | "report_templates"
  | "report_scheduling"
  | "email_delivery"
  | "notifications"
  | "white_label"
  | "profitability"
  | "risks"
  | "incidents"
  | "sla_tracking"
  | "escalation_rules"
  | "automation_engine"
  | "future_api_webhooks"
  | "priority_support"
  | "ai_report_assistant"
  | "ai_client_success"
  | "ai_client_analysis"
  | "ai_risk_assistant"
  | "ai_incident_assistant"
  | "ai_automation_builder"
  | "ai_workflow_translation"
  | "ai_knowledge_search"
  | "ai_knowledge_generation"
  | "ai_playbook_generation"
  | "ai_predictive_intelligence";

export type PlanLimitKey = "seats" | "max_clients" | "max_automations";

export type ActivityFeedLevel = "basic" | "full";

export type PlanFeatures = {
  seats: number;
  max_clients: number | null;
  max_automations: number | null;
  reports: boolean;
  pdf_export: boolean;
  customer_portal: boolean;
  activity_feed: ActivityFeedLevel;
  report_templates: boolean;
  report_scheduling: boolean;
  email_delivery: boolean;
  notifications: boolean;
  white_label: boolean;
  profitability: boolean;
  risks: boolean;
  incidents: boolean;
  sla_tracking: boolean;
  escalation_rules: boolean;
  automation_engine: boolean;
  future_api_webhooks: boolean;
  priority_support: boolean;
  ai_report_assistant: boolean;
  ai_client_success: boolean;
  ai_client_analysis: boolean;
  ai_risk_assistant: boolean;
  ai_incident_assistant: boolean;
  ai_automation_builder: boolean;
  ai_workflow_translation: boolean;
  ai_knowledge_search: boolean;
  ai_knowledge_generation: boolean;
  ai_playbook_generation: boolean;
  ai_predictive_intelligence: boolean;
};

export type PlanResolutionSource =
  | "active_subscription"
  | "starter_fallback"
  | "unmapped_price_id"
  | "dev_override"
  | "plan_override";

export type OrganizationPlanContext = {
  organizationId: string;
  planKey: PlanKey;
  planLabel: string;
  isActiveSubscription: boolean;
  features: PlanFeatures;
  planSource: PlanResolutionSource;
  devOverrideActive: boolean;
  planOverrideActive: boolean;
  subscriptionPriceId: string | null;
  subscriptionStatus: string | null;
  mappedPlanKeyFromPriceId: PlanKey | null;
};

export type ClientLimitUsage = {
  used: number;
  limit: number | null;
  isAtLimit: boolean;
  isOverLimit: boolean;
};

export type PlanFeatureCheckResult =
  | { allowed: true }
  | { allowed: false; message: string; requiredPlan: PlanKey; requiredPlanLabel: string };

export type PlanLimitCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

export type OrganizationPlanUsageSummary = {
  plan: OrganizationPlanContext;
  clients: ClientLimitUsage;
  enabledModules: string[];
  hasUsageOverPlan: boolean;
};
