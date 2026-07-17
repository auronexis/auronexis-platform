import { getStripePriceIdFallback } from "@/lib/env";
import {
  getAvailablePlans,
  safeGetPlanByKey,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import { resolveInternalPlanFromPaddlePriceId } from "@/lib/paddle/prices";

const PLAN_PRICE_ENV_KEYS: Record<PlanKey, string> = {
  starter: "STRIPE_STARTER_PRICE_ID",
  professional: "STRIPE_PROFESSIONAL_PRICE_ID",
  business: "STRIPE_BUSINESS_PRICE_ID",
  enterprise: "STRIPE_ENTERPRISE_PRICE_ID",
};

/** Mask Stripe price IDs for logs — never log full values. */
export function maskStripePriceId(priceId: string): string {
  const trimmed = priceId.trim();
  if (trimmed.length <= 8) {
    return "price_***";
  }

  return `${trimmed.slice(0, 8)}…`;
}

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
  return safeGetPlanByStripePriceId(priceId);
}

/** Resolve plan from Stripe price ID without throwing. */
export function safeGetPlanByStripePriceId(
  priceId: string | null | undefined,
): SubscriptionPlanDefinition | null {
  if (!priceId?.trim()) {
    return null;
  }

  const normalized = priceId.trim();

  for (const plan of getAvailablePlans()) {
    const envKey = PLAN_PRICE_ENV_KEYS[plan.key];
    const configuredPriceId = process.env[envKey]?.trim();

    if (configuredPriceId && configuredPriceId === normalized) {
      return safeGetPlanByKey(plan.key);
    }
  }

  const fallback = getStripePriceIdFallback();

  if (fallback && fallback === normalized) {
    return safeGetPlanByKey("professional");
  }

  return null;
}

/** Resolve plan key from Stripe price ID — server-only. */
export function getPlanKeyByPriceId(priceId: string): PlanKey | null {
  return safeGetPlanByStripePriceId(priceId)?.key ?? null;
}

export function safeGetPlanKeyByStripePriceId(priceId: string | null | undefined): PlanKey | null {
  return safeGetPlanByStripePriceId(priceId)?.key ?? null;
}

/**
 * Resolve plan key from a subscription row that may be Stripe- or Paddle-backed.
 * Unknown price IDs return null (fail closed — caller must not invent a plan).
 */
export function safeGetPlanKeyFromSubscriptionPrice(input: {
  billingProvider?: string | null;
  stripePriceId?: string | null;
  providerPriceId?: string | null;
}): PlanKey | null {
  if (input.billingProvider === "paddle") {
    const priceId = input.providerPriceId?.trim();
    if (!priceId) {
      return null;
    }
    try {
      return resolveInternalPlanFromPaddlePriceId(priceId);
    } catch {
      return null;
    }
  }

  return safeGetPlanKeyByStripePriceId(input.stripePriceId ?? input.providerPriceId);
}
