export type PlanKey = "starter" | "professional" | "business" | "enterprise";

export type PlanActionLabel = "current" | "choose" | "upgrade" | "downgrade";

export type SubscriptionPlanDefinition = {
  key: PlanKey;
  name: string;
  priceMonthly: number;
  currency: "EUR";
  description: string;
  features: string[];
  recommended?: boolean;
  order: number;
};

/** Public self-serve tiers shown in marketing and workspace plan pickers. */
export const PUBLIC_SELF_SERVE_PLAN_KEYS = ["professional", "business", "enterprise"] as const satisfies readonly PlanKey[];

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    key: "starter",
    name: "Professional",
    priceMonthly: 149,
    currency: "EUR",
    description: "Internal fallback tier — Professional limits apply without an active subscription",
    order: 0,
    features: [
      "Client management",
      "Reports",
      "PDF export",
      "Customer portal",
      "Basic activity feed",
    ],
  },
  {
    key: "professional",
    name: "Professional",
    priceMonthly: 149,
    currency: "EUR",
    description: "For growing agencies starting with automation and client portal delivery",
    order: 1,
    features: [
      "Up to 25 clients",
      "Automation workflows",
      "Client portal",
      "Integrations",
      "Report templates and scheduling",
      "AI report assistant",
    ],
  },
  {
    key: "business",
    name: "Business",
    priceMonthly: 499,
    currency: "EUR",
    description: "For established agencies with compliance, white-label, and higher limits",
    order: 2,
    recommended: true,
    features: [
      "Higher client and seat limits",
      "White label branding",
      "Compliance center",
      "Risk and incident management",
      "Automation engine",
      "Priority support options",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    priceMonthly: 1499,
    currency: "EUR",
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
  },
];

const PLAN_BY_KEY = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.key, plan]));

export const PLAN_KEYS: PlanKey[] = SUBSCRIPTION_PLANS.map((plan) => plan.key);

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

/** Look up a plan definition by key. */
export function getPlanByKey(key: PlanKey): SubscriptionPlanDefinition {
  const plan = PLAN_BY_KEY.get(key);

  if (!plan) {
    throw new Error(`Unknown subscription plan: ${key}`);
  }

  return plan;
}

/** Resolve the CTA label for a plan relative to the current subscription. */
export function resolvePlanActionLabel(
  targetKey: PlanKey,
  currentKey: PlanKey | null,
  isUsable: boolean,
): PlanActionLabel {
  if (isUsable && currentKey === targetKey) {
    return "current";
  }

  if (!isUsable || !currentKey) {
    return "choose";
  }

  const target = getPlanByKey(targetKey);
  const current = getPlanByKey(currentKey);

  if (target.order > current.order) {
    return "upgrade";
  }

  if (target.order < current.order) {
    return "downgrade";
  }

  return "choose";
}

export function formatPlanPrice(plan: SubscriptionPlanDefinition): string {
  if (plan.key === "enterprise") {
    return `From ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: plan.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(plan.priceMonthly)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(plan.priceMonthly);
}

export function getPlanActionButtonLabel(action: PlanActionLabel): string {
  switch (action) {
    case "current":
      return "Current plan";
    case "choose":
      return "Subscribe";
    case "upgrade":
      return "Upgrade";
    case "downgrade":
      return "Downgrade";
  }
}
