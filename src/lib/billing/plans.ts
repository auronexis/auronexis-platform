import { formatWorkspaceMoney } from "@/lib/i18n/format";
import {
  ACTIVE_EUR_PRICE_VERSION,
  PRIMARY_BILLING_CURRENCY,
  amountMinorToMajorUnits,
  getActiveCatalogPrice,
  type CatalogBillingCurrency,
} from "@/lib/billing/price-catalog";

export type PlanKey = "starter" | "professional" | "business" | "enterprise";

export type PlanActionLabel = "current" | "choose" | "upgrade" | "downgrade" | "scheduled";

export type SubscriptionPlanDefinition = {
  key: PlanKey;
  name: string;
  /** Canonical catalog monthly amount in integer minor units (VAT-inclusive list total). */
  amountMinor: number;
  /**
   * Major-unit convenience for Mollie amount.value formatting (amountMinor / 100).
   * Prefer amountMinor for money math.
   */
  priceMonthly: number;
  /** Catalog / billing currency for this plan definition. */
  currency: CatalogBillingCurrency;
  /** Active price catalog version. */
  priceVersion: string;
  description: string;
  features: string[];
  recommended?: boolean;
  order: number;
};

function buildPlanFromCatalog(input: {
  key: PlanKey;
  name: string;
  description: string;
  features: string[];
  order: number;
  recommended?: boolean;
  /** Fallback minor units when catalog lookup has no entry (starter mirror). */
  amountMinorFallback: number;
}): SubscriptionPlanDefinition {
  const catalog =
    input.key === "starter"
      ? null
      : getActiveCatalogPrice({ planKey: input.key, currency: PRIMARY_BILLING_CURRENCY });
  const amountMinor = catalog?.amountMinor ?? input.amountMinorFallback;
  return {
    key: input.key,
    name: input.name,
    amountMinor,
    priceMonthly: amountMinorToMajorUnits(amountMinor),
    currency: catalog?.currency ?? PRIMARY_BILLING_CURRENCY,
    priceVersion: catalog?.priceVersion ?? ACTIVE_EUR_PRICE_VERSION,
    description: input.description,
    features: [...input.features],
    recommended: input.recommended,
    order: input.order,
  };
}

/** Public self-serve tiers shown in marketing and workspace plan pickers. */
export const PUBLIC_SELF_SERVE_PLAN_KEYS = ["professional", "business", "enterprise"] as const satisfies readonly PlanKey[];

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  buildPlanFromCatalog({
    key: "starter",
    name: "Free",
    amountMinorFallback: 17_900,
    description:
      "Internal unpaid baseline — Free limits and modules apply without an active paid subscription",
    order: 0,
    features: [
      "Client management",
      "Reports",
      "PDF export",
      "Customer portal",
      "Basic activity feed",
    ],
  }),
  buildPlanFromCatalog({
    key: "professional",
    name: "Professional",
    amountMinorFallback: 17_900,
    description: "For growing agencies with client portal delivery, integrations, and AI-assisted reporting",
    order: 1,
    features: [
      "Up to 25 clients",
      "Client portal",
      "Integrations",
      "Report templates and scheduling",
      "AI report assistant",
      "Profitability tracking",
    ],
  }),
  buildPlanFromCatalog({
    key: "business",
    name: "Business",
    amountMinorFallback: 59_900,
    description: "For established agencies with compliance, white-label, and higher limits",
    order: 2,
    recommended: true,
    features: [
      "Higher client and seat limits",
      "Automation workflows",
      "White label branding",
      "Compliance center",
      "Risk and incident management",
      "Advanced AI knowledge features",
    ],
  }),
  buildPlanFromCatalog({
    key: "enterprise",
    name: "Enterprise",
    amountMinorFallback: 179_900,
    description: "For large portfolios and custom requirements",
    order: 3,
    features: [
      "Custom client limits",
      "Dedicated onboarding",
      "Priority support",
      "Plan overrides",
      "Advanced reporting",
      "Enterprise API readiness",
    ],
  }),
];

const PLAN_BY_KEY = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.key, plan]));

export const PLAN_KEYS: PlanKey[] = SUBSCRIPTION_PLANS.map((plan) => plan.key);

/** Type guard for plan keys — safe for unknown runtime strings. */
export function isPlanKey(value: string | null | undefined): value is PlanKey {
  return typeof value === "string" && PLAN_BY_KEY.has(value as PlanKey);
}

/** Look up a plan without throwing — returns null for unknown keys. */
export function safeGetPlanByKey(
  key: PlanKey | string | null | undefined,
): SubscriptionPlanDefinition | null {
  if (!isPlanKey(key)) {
    return null;
  }

  return PLAN_BY_KEY.get(key) ?? null;
}

/** Look up a plan definition by key. */
export function getPlanByKey(key: PlanKey): SubscriptionPlanDefinition {
  const plan = safeGetPlanByKey(key);

  if (!plan) {
    throw new Error(`Unknown subscription plan: ${key}`);
  }

  return plan;
}

/** Resolve the CTA label for a plan relative to the current subscription. Never throws. */
export function resolvePlanActionLabel(
  targetKey: PlanKey,
  currentKey: PlanKey | string | null | undefined,
  isUsable: boolean,
): PlanActionLabel {
  const target = safeGetPlanByKey(targetKey);
  const current = safeGetPlanByKey(currentKey);

  if (!target) {
    return "choose";
  }

  if (isUsable && current && current.key === target.key) {
    return "current";
  }

  if (!isUsable || !current) {
    return "choose";
  }

  if (target.order > current.order) {
    return "upgrade";
  }

  if (target.order < current.order) {
    return "downgrade";
  }

  return "choose";
}

/** All subscription plans in display order (includes legacy/internal keys). */
export function getAvailablePlans(): SubscriptionPlanDefinition[] {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.key !== "starter");
}

/** Public self-serve plans for workspace pricing UI — excludes invite-only programs. */
export function getPublicSelfServePlans(): SubscriptionPlanDefinition[] {
  return SUBSCRIPTION_PLANS.filter((plan) =>
    (PUBLIC_SELF_SERVE_PLAN_KEYS as readonly PlanKey[]).includes(plan.key),
  );
}

export function formatPlanPrice(plan: SubscriptionPlanDefinition): string {
  return formatWorkspaceMoney(plan.priceMonthly, plan.currency, "en");
}

export function getPlanActionButtonLabel(
  action: PlanActionLabel,
  options?: { changeType?: "upgrade" | "downgrade" },
): string {
  switch (action) {
    case "current":
      return "Current plan";
    case "choose":
      return "Subscribe";
    case "upgrade":
      return "Upgrade";
    case "downgrade":
      return "Downgrade";
    case "scheduled":
      return options?.changeType === "upgrade" ? "Upgrade scheduled" : "Downgrade scheduled";
  }
}
