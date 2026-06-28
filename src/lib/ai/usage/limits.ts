import "server-only";

import type { PlanKey } from "@/lib/billing/plans";

/** Monthly AI call limits by plan — enforced server-side only. */
export function getAIUsageLimit(planKey: PlanKey): number {
  switch (planKey) {
    case "starter":
      return 0;
    case "professional":
      return 100;
    case "business":
      return 500;
    case "enterprise":
      return 2000;
    default:
      return 0;
  }
}

export function getStartOfCurrentMonthUtc(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}
