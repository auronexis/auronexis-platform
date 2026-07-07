import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { PlanFeatureKey, PlanFeatures, PlanLimitKey } from "@/lib/plans/types";
import { getSeatPlanBlockReason } from "@/lib/seats/plans";
import type { SeatPlanBlockReason } from "@/lib/seats/types";

const PLAN_ORDER: Record<PlanKey, number> = {
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
};

const FEATURE_MINIMUM_PLAN: Record<PlanFeatureKey, PlanKey> = {
  reports: "starter",
  pdf_export: "starter",
  customer_portal: "starter",
  activity_feed: "starter",
  report_templates: "professional",
  report_scheduling: "professional",
  email_delivery: "professional",
  notifications: "professional",
  white_label: "professional",
  profitability: "professional",
  risks: "business",
  incidents: "business",
  sla_tracking: "business",
  escalation_rules: "business",
  automation_engine: "business",
  future_api_webhooks: "enterprise",
  priority_support: "enterprise",
  ai_report_assistant: "professional",
  ai_client_success: "professional",
  ai_client_analysis: "professional",
  ai_risk_assistant: "professional",
  ai_incident_assistant: "professional",
  ai_automation_builder: "professional",
  ai_workflow_translation: "professional",
  ai_knowledge_search: "professional",
  ai_knowledge_generation: "business",
  ai_playbook_generation: "business",
  ai_predictive_intelligence: "professional",
};

const PLAN_FEATURES: Record<PlanKey, PlanFeatures> = {
  starter: {
    seats: 1,
    max_clients: 5,
    max_automations: 0,
    reports: true,
    pdf_export: true,
    customer_portal: true,
    activity_feed: "basic",
    report_templates: false,
    report_scheduling: false,
    email_delivery: false,
    notifications: false,
    white_label: false,
    profitability: false,
    risks: false,
    incidents: false,
    sla_tracking: false,
    escalation_rules: false,
    automation_engine: false,
    future_api_webhooks: false,
    priority_support: false,
    ai_report_assistant: false,
    ai_client_success: false,
    ai_client_analysis: false,
    ai_risk_assistant: false,
    ai_incident_assistant: false,
    ai_automation_builder: false,
    ai_workflow_translation: false,
    ai_knowledge_search: false,
    ai_knowledge_generation: false,
    ai_playbook_generation: false,
    ai_predictive_intelligence: false,
  },
  professional: {
    seats: 3,
    max_clients: 25,
    max_automations: 5,
    reports: true,
    pdf_export: true,
    customer_portal: true,
    activity_feed: "basic",
    report_templates: true,
    report_scheduling: true,
    email_delivery: true,
    notifications: true,
    white_label: true,
    profitability: true,
    risks: false,
    incidents: false,
    sla_tracking: false,
    escalation_rules: false,
    automation_engine: false,
    future_api_webhooks: false,
    priority_support: false,
    ai_report_assistant: true,
    ai_client_success: true,
    ai_client_analysis: true,
    ai_risk_assistant: true,
    ai_incident_assistant: true,
    ai_automation_builder: true,
    ai_workflow_translation: true,
    ai_knowledge_search: true,
    ai_knowledge_generation: false,
    ai_playbook_generation: false,
    ai_predictive_intelligence: true,
  },
  business: {
    seats: 10,
    max_clients: 100,
    max_automations: 25,
    reports: true,
    pdf_export: true,
    customer_portal: true,
    activity_feed: "basic",
    report_templates: true,
    report_scheduling: true,
    email_delivery: true,
    notifications: true,
    white_label: true,
    profitability: true,
    risks: true,
    incidents: true,
    sla_tracking: true,
    escalation_rules: true,
    automation_engine: true,
    future_api_webhooks: false,
    priority_support: false,
    ai_report_assistant: true,
    ai_client_success: true,
    ai_client_analysis: true,
    ai_risk_assistant: true,
    ai_incident_assistant: true,
    ai_automation_builder: true,
    ai_workflow_translation: true,
    ai_knowledge_search: true,
    ai_knowledge_generation: true,
    ai_playbook_generation: true,
    ai_predictive_intelligence: true,
  },
  enterprise: {
    seats: 25,
    max_clients: null,
    max_automations: null,
    reports: true,
    pdf_export: true,
    customer_portal: true,
    activity_feed: "basic",
    report_templates: true,
    report_scheduling: true,
    email_delivery: true,
    notifications: true,
    white_label: true,
    profitability: true,
    risks: true,
    incidents: true,
    sla_tracking: true,
    escalation_rules: true,
    automation_engine: true,
    future_api_webhooks: true,
    priority_support: true,
    ai_report_assistant: true,
    ai_client_success: true,
    ai_client_analysis: true,
    ai_risk_assistant: true,
    ai_incident_assistant: true,
    ai_automation_builder: true,
    ai_workflow_translation: true,
    ai_knowledge_search: true,
    ai_knowledge_generation: true,
    ai_playbook_generation: true,
    ai_predictive_intelligence: true,
  },
};

export function getDefaultPlanKey(): PlanKey {
  return "starter";
}

export function planMeetsMinimum(currentPlan: PlanKey, minimumPlan: PlanKey): boolean {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[minimumPlan];
}

/** Full feature matrix for a plan key. */
export function getPlanFeatures(planKey: PlanKey): PlanFeatures {
  return PLAN_FEATURES[planKey] ?? PLAN_FEATURES[getDefaultPlanKey()];
}

/** Minimum plan required for a feature flag. */
export function getMinimumPlanForFeature(feature: PlanFeatureKey): PlanKey {
  return FEATURE_MINIMUM_PLAN[feature];
}

export function getRequiredPlanLabel(feature: PlanFeatureKey): string {
  return getPlanByKey(getMinimumPlanForFeature(feature)).name;
}

export function isFeatureEnabled(planKey: PlanKey, feature: PlanFeatureKey): boolean {
  const features = getPlanFeatures(planKey);
  const value = features[feature];

  if (typeof value === "boolean") {
    return value;
  }

  return Boolean(value);
}

export function getPlanLimit(planKey: PlanKey, limit: PlanLimitKey): number | null {
  const features = getPlanFeatures(planKey);

  if (limit === "seats") {
    return features.seats;
  }

  if (limit === "max_automations") {
    return features.max_automations;
  }

  return features.max_clients;
}

export function formatClientLimit(limit: number | null): string {
  if (limit === null) {
    return "Unlimited clients";
  }

  return `Up to ${limit} client${limit === 1 ? "" : "s"}`;
}

export function formatClientUsage(used: number, limit: number | null): string {
  if (limit === null) {
    return `${used} / Unlimited`;
  }

  return `${used} / ${limit}`;
}

export function getFeatureUpgradeMessage(feature: PlanFeatureKey): string {
  const planLabel = getRequiredPlanLabel(feature);
  return `This feature is available on the ${planLabel} plan.`;
}

export function getEnabledModuleLabels(features: PlanFeatures): string[] {
  const labels: string[] = [
    "Clients",
    "Reports",
    "PDF export",
    "Customer portal",
    "Activity feed",
  ];

  if (features.report_templates) labels.push("Report templates");
  if (features.report_scheduling) labels.push("Report scheduling");
  if (features.email_delivery) labels.push("Email delivery");
  if (features.notifications) labels.push("Notifications");
  if (features.white_label) labels.push("White label branding");
  if (features.profitability) labels.push("Profitability");
  if (features.risks) labels.push("Risks");
  if (features.incidents) labels.push("Incidents");
  if (features.sla_tracking) labels.push("SLA tracking");
  if (features.escalation_rules) labels.push("Escalation rules");
  if (features.automation_engine) labels.push("Automation engine");
  if (features.priority_support) labels.push("Priority support");
  if (features.future_api_webhooks) labels.push("API / webhooks");
  if (features.ai_report_assistant) labels.push("AI report assistant");
  if (features.ai_client_success) labels.push("AI client success");
  if (features.ai_client_analysis) labels.push("AI client analysis");
  if (features.ai_risk_assistant) labels.push("AI risk assistant");
  if (features.ai_incident_assistant) labels.push("AI incident assistant");
  if (features.ai_automation_builder) labels.push("AI automation builder");
  if (features.ai_workflow_translation) labels.push("AI workflow translation");
  if (features.ai_knowledge_search) labels.push("AI knowledge search");
  if (features.ai_knowledge_generation) labels.push("AI knowledge generation");
  if (features.ai_playbook_generation) labels.push("AI playbook generation");
  if (features.ai_predictive_intelligence) labels.push("Predictive intelligence");

  return labels;
}

export function getPricingHighlights(planKey: PlanKey): string[] {
  const features = getPlanFeatures(planKey);
  if (!features) {
    return [];
  }

  const seatLimit = features.seats;
  const clientLabel = formatClientLimit(features.max_clients);

  return [`${seatLimit} seat${seatLimit === 1 ? "" : "s"}`, clientLabel];
}

/** Client limit block message for pricing downgrade UI. */
export function getClientPlanBlockReason(
  planKey: PlanKey,
  usedClients: number,
): SeatPlanBlockReason {
  const limit = getPlanLimit(planKey, "max_clients");

  if (limit === null || usedClients <= limit) {
    return { blocked: false, message: null };
  }

  return {
    blocked: true,
    message: `Requires ${limit} client${limit === 1 ? "" : "s"}, you currently have ${usedClients}.`,
  };
}

/** Combined seat and client downgrade block checks for pricing UI. */
export function getPricingPlanBlockReason(
  planKey: PlanKey,
  usedSeats: number,
  usedClients: number,
): SeatPlanBlockReason {
  const seatBlock = getSeatPlanBlockReason(planKey, usedSeats);

  if (seatBlock.blocked) {
    return seatBlock;
  }

  return getClientPlanBlockReason(planKey, usedClients);
}
