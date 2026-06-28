import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { ProrationPreview } from "@/lib/billing/types";
import { formatBillingDate } from "@/lib/billing/types";

function planPriceCents(planKey: PlanKey): number {
  return getPlanByKey(planKey).priceMonthly * 100;
}

function resolveDirection(fromPlan: PlanKey, toPlan: PlanKey): ProrationPreview["direction"] {
  const from = getPlanByKey(fromPlan);
  const to = getPlanByKey(toPlan);
  if (from.order === to.order) return "same";
  return to.order > from.order ? "upgrade" : "downgrade";
}

export function calculateProrationPreview(input: {
  fromPlanKey: PlanKey;
  toPlanKey: PlanKey;
  periodStart: Date;
  periodEnd: Date;
  referenceDate?: Date;
}): ProrationPreview {
  const reference = input.referenceDate ?? new Date();
  const msInDay = 24 * 60 * 60 * 1000;
  const daysInPeriod = Math.max(
    1,
    Math.ceil((input.periodEnd.getTime() - input.periodStart.getTime()) / msInDay),
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((input.periodEnd.getTime() - reference.getTime()) / msInDay),
  );

  const currentPlanPriceCents = planPriceCents(input.fromPlanKey);
  const targetPlanPriceCents = planPriceCents(input.toPlanKey);
  const direction = resolveDirection(input.fromPlanKey, input.toPlanKey);

  const unusedCreditCents = Math.round((currentPlanPriceCents * daysRemaining) / daysInPeriod);
  const newPlanChargeCents = Math.round((targetPlanPriceCents * daysRemaining) / daysInPeriod);
  const netDueCents = Math.max(0, newPlanChargeCents - unusedCreditCents);

  return {
    fromPlanKey: input.fromPlanKey,
    toPlanKey: input.toPlanKey,
    direction,
    currentPlanPriceCents,
    targetPlanPriceCents,
    daysRemainingInPeriod: daysRemaining,
    daysInPeriod,
    creditCents: unusedCreditCents,
    chargeCents: newPlanChargeCents,
    netDueCents,
    formattedNetDue: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(netDueCents / 100),
    effectiveAt: formatBillingDate(reference.toISOString()) ?? reference.toISOString(),
  };
}

export function listProrationPreviews(input: {
  currentPlanKey: PlanKey;
  periodStart: string | null;
  periodEnd: string | null;
}): ProrationPreview[] {
  const plans: PlanKey[] = ["starter", "professional", "business", "enterprise"];
  const periodStart = input.periodStart ? new Date(input.periodStart) : new Date();
  const periodEnd = input.periodEnd
    ? new Date(input.periodEnd)
    : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  return plans
    .filter((planKey) => planKey !== input.currentPlanKey)
    .map((toPlanKey) =>
      calculateProrationPreview({
        fromPlanKey: input.currentPlanKey,
        toPlanKey,
        periodStart,
        periodEnd,
      }),
    );
}
