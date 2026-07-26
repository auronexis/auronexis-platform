import type { InternalPlan } from "@/lib/billing/provider-types";
import { isInternalPlan } from "@/lib/billing/provider-types";

/**
 * FastSpring product paths configured for Auroranexis.
 * External paths must remain exact (including `founding-member`).
 */
export const FASTSPRING_PRODUCT_PATHS = [
  "professional",
  "business",
  "enterprise",
  "pilot-client",
  "founding-member",
] as const;

export type FastSpringProductPath = (typeof FASTSPRING_PRODUCT_PATHS)[number];

/** Commercial / program keys mapped from FastSpring product paths. */
export type FastSpringMappedPlan =
  | InternalPlan
  | "pilot"
  | "founding";

const PRODUCT_PATH_SET = new Set<string>(FASTSPRING_PRODUCT_PATHS);

export function isFastSpringProductPath(value: string): value is FastSpringProductPath {
  return PRODUCT_PATH_SET.has(value);
}

/**
 * Map a FastSpring product path to the Auroranexis plan/program key.
 * Returns null for unknown paths (fail closed — do not invent).
 */
export function mapFastSpringProductPath(productPath: string | null | undefined): FastSpringMappedPlan | null {
  const path = (productPath ?? "").trim().toLowerCase();
  switch (path) {
    case "professional":
      return "professional";
    case "business":
      return "business";
    case "enterprise":
      return "enterprise";
    case "pilot-client":
      return "pilot";
    case "founding-member":
      return "founding";
    default:
      return null;
  }
}

/**
 * True when the mapped plan is a self-serve InternalPlan that may drive
 * organization_subscriptions entitlement-adjacent writes.
 * pilot / founding are recorded on provider_price_id but do not invent new PlanKey entitlements.
 */
export function isEntitlementDrivingFastSpringPlan(
  plan: FastSpringMappedPlan | null,
): plan is InternalPlan {
  return plan !== null && isInternalPlan(plan);
}
