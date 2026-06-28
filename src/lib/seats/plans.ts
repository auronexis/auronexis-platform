import type { PlanKey } from "@/lib/billing/plans";

const PLAN_SEAT_LIMITS: Record<PlanKey, number> = {
  starter: 1,
  professional: 3,
  business: 10,
  enterprise: 25,
};

/** Fixed seat limit for a subscription plan key. */
export function getSeatLimitForPlan(planKey: PlanKey): number {
  return PLAN_SEAT_LIMITS[planKey];
}

/** Default seat limit when no active paid subscription is on file. */
export function getDefaultSeatLimit(): number {
  return PLAN_SEAT_LIMITS.starter;
}

export function formatSeatsIncluded(limit: number): string {
  return `${limit} seat${limit === 1 ? "" : "s"} included`;
}

export function formatSeatUsage(used: number, limit: number): string {
  return `${used} / ${limit}`;
}

export function getSeatPlanBlockMessage(planKey: PlanKey, used: number): string {
  const limit = getSeatLimitForPlan(planKey);
  return `Requires ${limit} seat${limit === 1 ? "" : "s"}, you currently use ${used}.`;
}

/** Determine whether a target plan should be blocked on the pricing page. */
export function getSeatPlanBlockReason(
  planKey: PlanKey,
  usedSeats: number,
): { blocked: boolean; message: string | null } {
  const limit = getSeatLimitForPlan(planKey);

  if (usedSeats <= limit) {
    return { blocked: false, message: null };
  }

  return {
    blocked: true,
    message: getSeatPlanBlockMessage(planKey, usedSeats),
  };
}
