"use client";

import { useState, useTransition } from "react";
import { CheckoutBlockBanner } from "@/components/billing/checkout-block-banner";
import { PricingCard } from "@/components/pricing/pricing-card";
import {
  createCheckoutSessionAction,
  createPortalSessionAction,
} from "@/lib/billing/actions";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import { resolveCheckoutBlockState } from "@/lib/billing/checkout-block";
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
import type { PricingSelectionContext } from "@/lib/pricing/selection-context";
import { createFallbackPricingSelection } from "@/lib/pricing/selection-context";
import { normalizeStripeBillingUiStatus } from "@/lib/pricing/safe-stripe-status";
import { FormAlert } from "@/components/ui/form-alert";

export type { PricingSelectionContext } from "@/lib/pricing/selection-context";
export { buildPricingSelectionContext, createFallbackPricingSelection } from "@/lib/pricing/selection-context";

type PricingGridProps = {
  plans: SubscriptionPlanDefinition[];
  selection: PricingSelectionContext;
  stripeStatus: StripeBillingUiStatus;
  enterpriseContactHref: string;
  checkoutBlock?: CheckoutBlockState;
  canManage?: boolean;
};

export function PricingGrid({
  plans,
  selection,
  stripeStatus,
  enterpriseContactHref,
  checkoutBlock,
  canManage = false,
}: PricingGridProps) {
  const [pendingPlanKey, setPendingPlanKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPortalPending, startPortalTransition] = useTransition();
  const safeStripeStatus = normalizeStripeBillingUiStatus(stripeStatus);
  const safeSelection = selection ?? createFallbackPricingSelection();
  const safePlans = Array.isArray(plans) ? plans : [];
  const unavailableMessage = getPricingUnavailableMessage(safeStripeStatus);
  const resolvedCheckoutBlock =
    checkoutBlock ??
    resolveCheckoutBlockState({
      overview: safeSelection.overview,
      invoices: safeSelection.invoices ?? [],
    });

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

  const openPortal = () => {
    setError(null);
    startPortalTransition(async () => {
      const result = await createPortalSessionAction();
      if (result?.error) {
        setError(sanitizeBillingCustomerError(new Error(result.error), "Unable to open billing portal."));
      }
    });
  };

  return (
    <div className="space-y-6">
      {unavailableMessage ? (
        <FormAlert variant="warning">{unavailableMessage}</FormAlert>
      ) : null}

      {resolvedCheckoutBlock.blocked ? (
        <CheckoutBlockBanner
          checkoutBlock={resolvedCheckoutBlock}
          canManage={canManage || safeSelection.canManage}
          portalAvailable={safeStripeStatus.portalAvailable}
          onOpenPortal={openPortal}
          isPortalPending={isPortalPending}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {safePlans.map((plan) => {
          const action = resolvePlanActionLabel(
            plan.key,
            safeSelection.currentPlanKey,
            safeSelection.isUsable,
          );
          const isCurrent = safeSelection.isUsable && action === "current";
          const isDowngrade = action === "downgrade";
          const seatBlock = getPricingPlanBlockReason(
            plan.key,
            safeSelection.usedSeats,
            safeSelection.usedClients,
          );
          const disabledReasons = getPricingButtonDisabledReasons({
            planKey: plan.key,
            currentPlanKey: safeSelection.currentPlanKey,
            isUsable: safeSelection.isUsable,
            hasPaymentProblem: safeSelection.hasPaymentProblem,
            isPaymentPending: safeSelection.isPaymentPending,
            hasOpenUnpaidInvoice: safeSelection.hasOpenUnpaidInvoice,
            overview: safeSelection.overview,
            invoices: safeSelection.invoices ?? [],
            checkoutBlock: resolvedCheckoutBlock,
            canManage: safeSelection.canManage,
            isLoading: isPending && pendingPlanKey === plan.key,
            isCurrent,
            isDowngrade,
            seatBlockMessage: seatBlock.blocked ? seatBlock.message : null,
            stripeStatus: safeStripeStatus,
          });

          return (
            <PricingCard
              key={plan.key}
              plan={plan}
              action={action}
              isCurrent={isCurrent}
              isLoading={
                (isPending && pendingPlanKey === plan.key) ||
                (isPortalPending && isDowngrade)
              }
              canManage={safeSelection.canManage}
              seatBlockMessage={seatBlock.blocked ? seatBlock.message : null}
              blockedCheckoutMessage={
                resolvedCheckoutBlock.blocked && plan.key !== "enterprise"
                  ? (resolvedCheckoutBlock.bannerMessage ?? resolvedCheckoutBlock.message)
                  : null
              }
              disabledReasons={disabledReasons}
              isDisabled={isPricingButtonDisabled(plan.key, disabledReasons)}
              stripeStatus={safeStripeStatus}
              enterpriseContactHref={enterpriseContactHref}
              onSelect={() => {
                if (isDowngrade && safeSelection.isUsable && safeStripeStatus.portalAvailable) {
                  openPortal();
                  return;
                }
                selectPlan(plan.key);
              }}
            />
          );
        })}
      </div>

      {error ? <FormAlert variant="warning">{error}</FormAlert> : null}
    </div>
  );
}
