"use client";

import { useState, useTransition } from "react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { createCheckoutSessionAction } from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import type { StripeBillingUiStatus } from "@/lib/billing/types";
import {
  resolvePlanActionLabel,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import {
  getPricingButtonDisabledReasons,
  getPricingUnavailableMessage,
  isPricingButtonDisabled,
} from "@/lib/diagnostics/pricing-reasons";
import { getPricingPlanBlockReason } from "@/lib/plans/features";
import { FormAlert } from "@/components/ui/form-alert";

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
  stripeStatus: StripeBillingUiStatus;
  enterpriseContactHref: string;
};

export function PricingGrid({ plans, selection, stripeStatus, enterpriseContactHref }: PricingGridProps) {
  const [pendingPlanKey, setPendingPlanKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const unavailableMessage = getPricingUnavailableMessage(stripeStatus);

  const selectPlan = (planKey: PlanKey) => {
    if (planKey === "enterprise") {
      return;
    }

    setError(null);
    setPendingPlanKey(planKey);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(planKey);
      if (result?.error) {
        setError(sanitizeBillingCustomerError(new Error(result.error), "Unable to start checkout."));
        setPendingPlanKey(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {unavailableMessage ? (
        <FormAlert variant="warning">{unavailableMessage}</FormAlert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
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
            stripeStatus,
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
              isDisabled={isPricingButtonDisabled(plan.key, disabledReasons)}
              stripeStatus={stripeStatus}
              enterpriseContactHref={enterpriseContactHref}
              onSelect={() => selectPlan(plan.key)}
            />
          );
        })}
      </div>

      {error ? <FormAlert variant="warning">{error}</FormAlert> : null}
    </div>
  );
}
