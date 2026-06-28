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

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    priceMonthly: 29,
    currency: "EUR",
    description: "For freelancers and small agencies",
    order: 1,
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
    priceMonthly: 79,
    currency: "EUR",
    description: "For growing agencies",
    order: 2,
    recommended: true,
    features: [
      "Everything in Starter",
      "Report templates",
      "Report scheduling",
      "Email delivery",
      "Notifications",
      "White label branding",
    ],
  },
  {
    key: "business",
    name: "Business",
    priceMonthly: 149,
    currency: "EUR",
    description: "For MSPs and operational teams",
    order: 3,
    features: [
      "Everything in Professional",
      "Risk management",
      "Incident management",
      "SLA tracking",
      "Escalation rules",
      "Automation engine",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    priceMonthly: 499,
    currency: "EUR",
    description: "For advanced teams",
    order: 4,
    features: [
      "Everything in Business",
      "Priority support",
      "Advanced reporting",
      "Custom onboarding",
      "Future API/Webhooks ready",
    ],
  },
];

const PLAN_BY_KEY = new Map(SUBSCRIPTION_PLANS.map((plan) => [plan.key, plan]));

export const PLAN_KEYS: PlanKey[] = SUBSCRIPTION_PLANS.map((plan) => plan.key);

/** All subscription plans in display order. */
export function getAvailablePlans(): SubscriptionPlanDefinition[] {
  return SUBSCRIPTION_PLANS;
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
  isActive: boolean,
): PlanActionLabel {
  if (isActive && currentKey === targetKey) {
    return "current";
  }

  if (!isActive || !currentKey) {
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
      return "Choose Plan";
    case "upgrade":
      return "Upgrade";
    case "downgrade":
      return "Downgrade";
  }
}
