import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";

export type MollieUpgradeSelfServePlanKey = Extract<PlanKey, "professional" | "business">;

export type MollieUpgradeProration = {
  previousPlanKey: MollieUpgradeSelfServePlanKey;
  targetPlanKey: MollieUpgradeSelfServePlanKey;
  periodStart: string;
  periodEnd: string;
  remainingMs: number;
  totalPeriodMs: number;
  previousPriceCents: number;
  targetPriceCents: number;
  netDueCents: number;
  currency: string;
  formattedNetDue: string;
};

function formatUpgradeAmount(value: number): string {
  return value.toFixed(2);
}

/** Normalize Mollie date-only boundaries to a stable UTC instant for remaining-time math. */
export function normalizeMolliePeriodBoundary(value: string, bound: "start" | "end"): number {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return Date.parse(bound === "end" ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`);
  }
  return Date.parse(trimmed);
}

/**
 * Proration: (target_price - current_price) * (remaining_time / total_period_time)
 * using minor units. Fails closed when period bounds are unavailable.
 *
 * Professional $179 → Business $599 uses catalog monthly prices (USD minor units).
 */
export function calculateMollieUpgradeProration(input: {
  previousPlanKey: MollieUpgradeSelfServePlanKey;
  targetPlanKey: MollieUpgradeSelfServePlanKey;
  currentPeriodStart: string | null | undefined;
  currentPeriodEnd: string | null | undefined;
  referenceDate?: Date;
}): MollieUpgradeProration {
  if (!input.currentPeriodStart || !input.currentPeriodEnd) {
    throw new Error(
      "Billing period boundaries are unavailable — refusing prorated upgrade. Contact support.",
    );
  }

  const periodStartMs = normalizeMolliePeriodBoundary(input.currentPeriodStart, "start");
  const periodEndMs = normalizeMolliePeriodBoundary(input.currentPeriodEnd, "end");
  if (!Number.isFinite(periodStartMs) || !Number.isFinite(periodEndMs) || periodEndMs <= periodStartMs) {
    throw new Error("Billing period boundaries are invalid — refusing prorated upgrade.");
  }

  const now = input.referenceDate ?? new Date();
  const remainingMs = Math.max(0, periodEndMs - now.getTime());
  const totalPeriodMs = periodEndMs - periodStartMs;

  const previousPlan = getPlanByKey(input.previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  const previousPriceCents = previousPlan.priceMonthly * 100;
  const targetPriceCents = targetPlan.priceMonthly * 100;

  const priceDeltaCents = targetPriceCents - previousPriceCents;
  const netDueCents = Math.max(0, Math.round((priceDeltaCents * remainingMs) / totalPeriodMs));

  return {
    previousPlanKey: input.previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    periodStart: input.currentPeriodStart,
    periodEnd: input.currentPeriodEnd,
    remainingMs,
    totalPeriodMs,
    previousPriceCents,
    targetPriceCents,
    netDueCents,
    currency: targetPlan.currency,
    formattedNetDue: formatUpgradeAmount(netDueCents / 100),
  };
}
