"use client";

import { useState, useTransition } from "react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { createCheckoutSessionAction, createPortalSessionAction } from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import type { StripeBillingUiStatus } from "@/lib/billing/types";
import {
  resolvePlanActionLabel,
  type PlanKey,
  type SubscriptionPlanDefinition,
} from "@/lib/billing/plans";
import {
  getPricingButtonDisabledReasons,
  getPricingPaymentBlockMessage,
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
};

export function PricingGrid({ plans, selection, stripeStatus, enterpriseContactHref }: PricingGridProps) {
  const [pendingPlanKey, setPendingPlanKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPortalPending, startPortalTransition] = useTransition();
  const safeStripeStatus = normalizeStripeBillingUiStatus(stripeStatus);
  const safeSelection = selection ?? createFallbackPricingSelection();
  const safePlans = Array.isArray(plans) ? plans : [];
  const unavailableMessage = getPricingUnavailableMessage(safeStripeStatus);
  const paymentBlockMessage = getPricingPaymentBlockMessage({
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

      {paymentBlockMessage ? (
        <FormAlert variant="warning">
          {paymentBlockMessage}
          {safeSelection.latestOpenInvoiceUrl ? (
            <>
              {" "}
              <a
                href={safeSelection.latestOpenInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                Open invoice
              </a>
            </>
          ) : null}
          {safeSelection.canManage && safeStripeStatus.portalAvailable ? (
            <>
              {" "}
              <button
                type="button"
                className="font-medium underline"
                onClick={openPortal}
                disabled={isPortalPending}
              >
                Open billing portal
              </button>
            </>
          ) : null}
        </FormAlert>
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
