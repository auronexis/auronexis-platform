import type { PlanKey } from "@/lib/billing/plans";

export type EntitlementFeatureKey =
  | "basic_dashboard"
  | "clients_basic"
  | "invoices_basic"
  | "dashboard"
  | "clients"
  | "reports"
  | "sla_policies"
  | "activity_history"
  | "billing_portal"
  | "incidents"
  | "automations"
  | "profitability"
  | "team"
  | "api"
  | "sso"
  | "priority_support"
  | "custom_limits"
  | "dashboard_read"
  | "billing_page"
  | "settings_billing"
  | "plans_page"
  | "support_page";

export type EntitlementLimitKey =
  | "maxClients"
  | "maxSeats"
  | "maxReportsPerMonth"
  | "aiCreditsPerMonth";

export type PlanEntitlements = {
  maxClients: number | null;
  maxSeats: number | null;
  maxReportsPerMonth: number | null;
  aiCreditsPerMonth: number | null;
  features: readonly EntitlementFeatureKey[];
};

export type ResolvedEntitlements = PlanEntitlements & {
  planKey: PlanKey | null;
  /** Plan mapped from Stripe price id — for display even when access is limited. */
  resolvedPlanKey: PlanKey | null;
  planLabel: string;
  isPaidAccess: boolean;
  subscriptionStatus: string | null;
  fallbackPath: "paid_plan" | "minimal_access" | "starter_default";
};

export type EntitlementCheckResult =
  | { allowed: true }
  | { allowed: false; message: string };

export type EntitlementUsageSnapshot = {
  key: EntitlementLimitKey;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  percentUsed: number | null;
  atLimit: boolean;
  approachingLimit: boolean;
};

export type EntitlementsUsageSummary = {
  entitlements: ResolvedEntitlements;
  usage: EntitlementUsageSnapshot[];
  featureLabels: string[];
  hasLimitWarning: boolean;
  upgradeHref: "/settings/plans";
};
