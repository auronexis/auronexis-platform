import type { PlanKey } from "@/lib/billing/plans";

/**
 * Canonical plan ranks — Starter < Professional < Business < Enterprise.
 * Feature gates use >= semantics via planMeetsMinimum / planRankAtLeast.
 */
export const PLAN_RANK: Record<PlanKey, number> = {
  starter: 1,
  professional: 2,
  business: 3,
  enterprise: 4,
};

export const PLAN_HIERARCHY_ORDER: readonly PlanKey[] = [
  "starter",
  "professional",
  "business",
  "enterprise",
] as const;

export function getPlanRank(planKey: PlanKey): number {
  return PLAN_RANK[planKey];
}

/** True when currentPlan is at least as high as minimumPlan (inclusive). */
export function planRankAtLeast(currentPlan: PlanKey, minimumPlan: PlanKey): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[minimumPlan];
}

/** Alias used by feature gates — identical to planRankAtLeast. */
export function planMeetsMinimum(currentPlan: PlanKey, minimumPlan: PlanKey): boolean {
  return planRankAtLeast(currentPlan, minimumPlan);
}