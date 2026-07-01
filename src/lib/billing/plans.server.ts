import { getStripePriceIdFallback } from "@/lib/env";
import {
  getAvailablePlans,
  getPlanByKey,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";

const PLAN_PRICE_ENV_KEYS: Record<PlanKey, string> = {
  starter: "STRIPE_STARTER_PRICE_ID",
  professional: "STRIPE_PROFESSIONAL_PRICE_ID",
  business: "STRIPE_BUSINESS_PRICE_ID",
  enterprise: "STRIPE_ENTERPRISE_PRICE_ID",
};

/** Resolve Stripe price ID for a plan — server-only. */
export function getPlanPriceId(planKey: PlanKey): string {
  if (planKey === "enterprise") {
    console.warn("[stripe] Checkout requested for Enterprise plan — use sales contact flow.");
    throw new Error("Contact sales for Enterprise plans.");
  }

  const envKey = PLAN_PRICE_ENV_KEYS[planKey];
  const planPriceId = process.env[envKey];

  if (planPriceId && planPriceId.trim().length > 0) {
    return planPriceId.trim();
  }

  console.warn(`[stripe] Missing price ID for ${planKey} plan (${envKey}).`);
  throw new Error("Checkout temporarily unavailable.");
}

/** Look up plan definition from a Stripe price ID — server-only. */
export function getPlanByPriceId(priceId: string): SubscriptionPlanDefinition | null {
  const normalized = priceId.trim();

  for (const plan of getAvailablePlans()) {
    const envKey = PLAN_PRICE_ENV_KEYS[plan.key];
    const configuredPriceId = process.env[envKey]?.trim();

    if (configuredPriceId && configuredPriceId === normalized) {
      return getPlanByKey(plan.key);
    }
  }

  const fallback = getStripePriceIdFallback();

  if (fallback && fallback === normalized) {
    return getPlanByKey("professional");
  }

  return null;
}

/** Resolve plan key from Stripe price ID — server-only. */
export function getPlanKeyByPriceId(priceId: string): PlanKey | null {
  return getPlanByPriceId(priceId)?.key ?? null;
}
