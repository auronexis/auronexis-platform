"use client";

import { useState, useTransition } from "react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { createCheckoutSessionAction } from "@/lib/billing/actions";
import {
  resolvePlanActionLabel,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import type { StripeEnvDiagnostics } from "@/lib/diagnostics/types";
import {
  getPricingButtonDisabledReasons,
  isPricingButtonDisabled,
} from "@/lib/diagnostics/pricing-reasons";
import { getPricingPlanBlockReason } from "@/lib/plans/features";

export type PricingSelectionContext = {
  currentPlanKey: PlanKey | null;
  isActive: boolean;
  canManage: boolean;
  usedSeats: number;
  usedClients: number;
};

type PricingGridProps = {
  plans: SubscriptionPlanDefinition[];
  selection: PricingSelectionContext;
  stripeEnv: StripeEnvDiagnostics;
};
export function PricingGrid({ plans, selection, stripeEnv }: PricingGridProps) {
  const [pendingPlanKey, setPendingPlanKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectPlan = (planKey: PlanKey) => {
    setError(null);
    setPendingPlanKey(planKey);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(planKey);
      if (result?.error) {
        setError(result.error);
        setPendingPlanKey(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const action = resolvePlanActionLabel(
            plan.key,
            selection.currentPlanKey,
            selection.isActive,
          );
          const isCurrent = action === "current";
          const seatBlock = getPricingPlanBlockReason(
            plan.key,
            selection.usedSeats,
            selection.usedClients,
          );
          const disabledReasons = getPricingButtonDisabledReasons({
            planKey: plan.key,
            currentPlanKey: selection.currentPlanKey,
            isActive: selection.isActive,
            canManage: selection.canManage,
            isLoading: isPending && pendingPlanKey === plan.key,
            isCurrent,
            seatBlockMessage: seatBlock.blocked ? seatBlock.message : null,
            stripeEnv,
          });

          return (
            <PricingCard
              key={plan.key}
              plan={plan}
              action={action}
              isCurrent={isCurrent}
              isLoading={isPending && pendingPlanKey === plan.key}
              canManage={selection.canManage}
              seatBlockMessage={seatBlock.blocked ? seatBlock.message : null}
              disabledReasons={disabledReasons}
              isDisabled={isPricingButtonDisabled(disabledReasons)}
              onSelect={() => selectPlan(plan.key)}
            />
          );        })}
      </div>

      {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
