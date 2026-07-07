import type { PlanKey } from "@/lib/billing/plans";
import type { EntitlementFeatureKey, EntitlementLimitKey, PlanEntitlements } from "@/lib/entitlements/types";

const STARTER_FEATURES = [
  "basic_dashboard",
  "clients_basic",
  "invoices_basic",
] as const satisfies readonly EntitlementFeatureKey[];

const PROFESSIONAL_FEATURES = [
  "dashboard",
  "clients",
  "reports",
  "sla_policies",
  "activity_history",
  "billing_portal",
] as const satisfies readonly EntitlementFeatureKey[];

const BUSINESS_FEATURES = [
  "dashboard",
  "clients",
  "reports",
  "sla_policies",
  "incidents",
  "automations",
  "profitability",
  "team",
  "billing_portal",
  "activity_history",
] as const satisfies readonly EntitlementFeatureKey[];

const ENTERPRISE_FEATURES = [
  "dashboard",
  "clients",
  "reports",
  "sla_policies",
  "incidents",
  "automations",
  "profitability",
  "team",
  "billing_portal",
  "activity_history",
  "api",
  "sso",
  "priority_support",
  "custom_limits",
] as const satisfies readonly EntitlementFeatureKey[];

export const MINIMAL_ACCESS_FEATURES = [
  "dashboard_read",
  "billing_page",
  "settings_billing",
  "plans_page",
  "support_page",
] as const satisfies readonly EntitlementFeatureKey[];

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  starter: {
    maxClients: 5,
    maxSeats: 1,
    maxReportsPerMonth: 10,
    aiCreditsPerMonth: 0,
    features: STARTER_FEATURES,
  },
  professional: {
    maxClients: 25,
    maxSeats: 3,
    maxReportsPerMonth: 100,
    aiCreditsPerMonth: 500,
    features: PROFESSIONAL_FEATURES,
  },
  business: {
    maxClients: 100,
    maxSeats: 10,
    maxReportsPerMonth: 500,
    aiCreditsPerMonth: 3000,
    features: BUSINESS_FEATURES,
  },
  enterprise: {
    maxClients: null,
    maxSeats: null,
    maxReportsPerMonth: null,
    aiCreditsPerMonth: null,
    features: ENTERPRISE_FEATURES,
  },
};

export const MINIMAL_ENTITLEMENTS: PlanEntitlements = {
  maxClients: 0,
  maxSeats: 1,
  maxReportsPerMonth: 0,
  aiCreditsPerMonth: 0,
  features: MINIMAL_ACCESS_FEATURES,
};

export const ENTITLEMENT_LIMIT_LABELS: Record<EntitlementLimitKey, string> = {
  maxClients: "client",
  maxSeats: "seat",
  maxReportsPerMonth: "monthly report",
  aiCreditsPerMonth: "AI credit",
};

export const ENTITLEMENT_FEATURE_LABELS: Record<EntitlementFeatureKey, string> = {
  basic_dashboard: "Basic dashboard",
  clients_basic: "Clients (basic)",
  invoices_basic: "Invoices (basic)",
  dashboard: "Dashboard",
  clients: "Clients",
  reports: "Reports",
  sla_policies: "SLA policies",
  activity_history: "Activity history",
  billing_portal: "Billing portal",
  incidents: "Incidents",
  automations: "Automations",
  profitability: "Profitability",
  team: "Team management",
  api: "Public API",
  sso: "Single sign-on",
  priority_support: "Priority support",
  custom_limits: "Custom limits",
  dashboard_read: "Dashboard (read-only)",
  billing_page: "Billing",
  settings_billing: "Billing settings",
  plans_page: "Plans",
  support_page: "Support",
};

/** Static entitlements for a plan key — does not consider subscription state. */
export function getEntitlementsForPlan(planKey: PlanKey): PlanEntitlements {
  return PLAN_ENTITLEMENTS[planKey];
}

export function isFeatureEnabled(
  entitlements: Pick<PlanEntitlements, "features">,
  feature: EntitlementFeatureKey,
): boolean {
  return entitlements.features.includes(feature);
}

export function getNumericLimit(
  entitlements: PlanEntitlements,
  limitKey: EntitlementLimitKey,
): number | null {
  return entitlements[limitKey];
}

export function isUnlimited(limit: number | null): limit is null {
  return limit === null;
}

export function formatEntitlementFeatureLabels(
  features: readonly EntitlementFeatureKey[],
): string[] {
  return features.map((feature) => ENTITLEMENT_FEATURE_LABELS[feature]);
}
