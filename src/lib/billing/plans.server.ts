import type { PlanKey, SubscriptionPlanDefinition } from "@/lib/billing/plans";
import { resolveInternalPlanFromPaddlePriceId } from "@/lib/paddle/prices";

/** Mask a provider price ID for logs — never log full values. */
export function maskStripePriceId(priceId: string): string {
  const trimmed = priceId.trim();
  if (trimmed.length <= 8) {
    return "price_***";
  }

  return `${trimmed.slice(0, 8)}…`;
}

/**
 * @deprecated Stripe checkout removed — Paddle price resolution lives in
 * "@/lib/paddle/prices" and "@/lib/paddle/checkout". Legacy archive only;
 * always returns null so callers fail closed instead of inventing a plan.
 */
export function safeGetPlanByStripePriceId(
  _priceId: string | null | undefined,
): SubscriptionPlanDefinition | null {
  return null;
}

/** @deprecated Legacy archive only — use safeGetPlanKeyFromSubscriptionPrice. Always returns null. */
export function getPlanByPriceId(priceId: string): SubscriptionPlanDefinition | null {
  return safeGetPlanByStripePriceId(priceId);
}

/** @deprecated Legacy archive only — use safeGetPlanKeyFromSubscriptionPrice. Always returns null. */
export function getPlanKeyByPriceId(priceId: string): PlanKey | null {
  return safeGetPlanByStripePriceId(priceId)?.key ?? null;
}

/** @deprecated Legacy archive only — use safeGetPlanKeyFromSubscriptionPrice. Always returns null. */
export function safeGetPlanKeyByStripePriceId(priceId: string | null | undefined): PlanKey | null {
  return safeGetPlanByStripePriceId(priceId)?.key ?? null;
}

/**
 * Resolve plan key from a subscription row that may be Paddle-backed or a
 * legacy Stripe-backed row. Legacy Stripe price ids never map (fail closed —
 * caller must not invent a plan). Unknown price IDs return null.
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
