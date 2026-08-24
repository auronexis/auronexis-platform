import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  isValidMollieBillingPeriod,
  normalizeMolliePeriodBoundary,
} from "@/lib/billing/providers/mollie/billing-period";

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

export { normalizeMolliePeriodBoundary, isValidMollieBillingPeriod };

function formatUpgradeAmount(value: number): string {
  return value.toFixed(2);
}

/**
 * Proration: (target_price - current_price) * (remaining_time / total_period_time)
 * using minor units. Fails closed when period bounds are unavailable.
 *
 * Professional €179 → Business €599 uses catalog amountMinor (EUR).
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

  if (!isValidMollieBillingPeriod(input.currentPeriodStart, input.currentPeriodEnd)) {
    throw new Error("Billing period boundaries are invalid — refusing prorated upgrade.");
  }

  const periodStartMs = normalizeMolliePeriodBoundary(input.currentPeriodStart, "start");
  const periodEndMs = normalizeMolliePeriodBoundary(input.currentPeriodEnd, "end");

  const now = input.referenceDate ?? new Date();
  const remainingMs = Math.max(0, periodEndMs - now.getTime());
  const totalPeriodMs = periodEndMs - periodStartMs;

  const previousPlan = getPlanByKey(input.previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  const previousPriceCents = previousPlan.amountMinor;
  const targetPriceCents = targetPlan.amountMinor;

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
