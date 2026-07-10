import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { isUnlimited, PLAN_ENTITLEMENTS } from "@/lib/entitlements/definitions";

/** Sentinel for unlimited enterprise AI credits in UI summaries. */
export const AI_UNLIMITED_CREDITS_SENTINEL = 1_000_000;

/** Monthly AI call limits by plan — aligned with entitlement aiCreditsPerMonth. */
export function getAIUsageLimit(planKey: PlanKey): number {
  const credits = PLAN_ENTITLEMENTS[planKey]?.aiCreditsPerMonth ?? 0;

  if (isUnlimited(credits)) {
    return AI_UNLIMITED_CREDITS_SENTINEL;
  }

  return credits;
}

export function isAIUsageUnlimited(planKey: PlanKey): boolean {
  const credits = PLAN_ENTITLEMENTS[planKey]?.aiCreditsPerMonth ?? 0;
  return isUnlimited(credits);
}

export function getStartOfCurrentMonthUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
