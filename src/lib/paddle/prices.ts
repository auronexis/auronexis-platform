import "server-only";

import type { InternalPlan } from "@/lib/billing/provider-types";

const PRICE_ENV_KEYS = {
  professional: "PADDLE_PRICE_PROFESSIONAL_MONTHLY",
  business: "PADDLE_PRICE_BUSINESS_MONTHLY",
  enterprise: "PADDLE_PRICE_ENTERPRISE_MONTHLY",
} as const satisfies Record<InternalPlan, string>;

export type PaddlePriceMapping = {
  priceId: string;
  internalPlan: InternalPlan;
};

/**
 * Resolve allowlisted Paddle price ID for an internal plan.
 * Fails closed when the env var is missing — never invents pri_ IDs.
 */
export function getPaddlePriceIdForPlan(plan: InternalPlan): string {
  if (plan === "enterprise") {
    throw new Error(
      "Enterprise plans require a written quotation. Self-serve Paddle checkout is not available for Enterprise.",
    );
  }

  const envKey = PRICE_ENV_KEYS[plan];
  const value = process.env[envKey]?.trim();
  if (!value) {
    throw new Error(
      `Missing Paddle price configuration: ${envKey}. Set the sandbox/production price ID before enabling Paddle checkout.`,
    );
  }
  if (!value.startsWith("pri_")) {
    throw new Error(
      `Invalid Paddle price ID in ${envKey}. Expected a Paddle Billing price ID starting with "pri_".`,
    );
  }
  return value;
}

/** Build reverse map from configured env price IDs → internal plan. */
export function buildPaddlePriceMap(): Map<string, InternalPlan> {
  const map = new Map<string, InternalPlan>();

  for (const plan of Object.keys(PRICE_ENV_KEYS) as InternalPlan[]) {
    if (plan === "enterprise") {
      const enterpriseId = process.env[PRICE_ENV_KEYS.enterprise]?.trim();
      if (enterpriseId?.startsWith("pri_")) {
        map.set(enterpriseId, "enterprise");
      }
      continue;
    }
    const envKey = PRICE_ENV_KEYS[plan];
    const priceId = process.env[envKey]?.trim();
    if (priceId?.startsWith("pri_")) {
      map.set(priceId, plan);
    }
  }

  return map;
}

/**
 * Map a Paddle price ID to an internal plan.
 * Unknown IDs fail closed — never default to a plan.
 */
export function resolveInternalPlanFromPaddlePriceId(priceId: string): InternalPlan {
  const trimmed = priceId.trim();
  if (!trimmed) {
    throw new Error("Missing Paddle price ID — cannot resolve internal plan.");
  }

  const mapped = buildPaddlePriceMap().get(trimmed);
  if (!mapped) {
    console.error("[paddle] unknown price ID — failing closed", {
      priceIdPrefix: trimmed.slice(0, 8),
    });
    throw new Error(
      "Unknown Paddle price ID. Access was not granted. Review price configuration.",
    );
  }
  return mapped;
}

export function getPaddlePriceEnvKeys(): typeof PRICE_ENV_KEYS {
  return PRICE_ENV_KEYS;
}
