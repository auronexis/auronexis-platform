"use client";

import { useState, useTransition } from "react";
import { PricingCard } from "@/components/pricing/pricing-card";
import { createCheckoutSessionAction, createPortalSessionAction } from "@/lib/billing/actions";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import { hasOpenUnpaidInvoice } from "@/lib/billing/checkout-guards";
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
import { FormAlert } from "@/components/ui/form-alert";
import type { BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { findLatestOpenInvoice } from "@/lib/billing/status";

export type PricingSelectionContext = {
  currentPlanKey: PlanKey | null;
  /** True when subscription is active or trialing (current plan badge). */
  isUsable: boolean;
  hasPaymentProblem: boolean;
  isPaymentPending: boolean;
  hasOpenUnpaidInvoice: boolean;
  latestOpenInvoiceUrl: string | null;
  canManage: boolean;
  usedSeats: number;
  usedClients: number;
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
};

export function buildPricingSelectionContext(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  canManage: boolean;
  usedSeats: number;
  usedClients: number;
}): PricingSelectionContext {
  const latestOpen = findLatestOpenInvoice(input.invoices);

  return {
    currentPlanKey: input.overview.currentPlanKey,
    isUsable: input.overview.isUsable,
    hasPaymentProblem: input.overview.hasPaymentProblem,
    isPaymentPending: input.overview.isPaymentPending,
    hasOpenUnpaidInvoice: hasOpenUnpaidInvoice(input.invoices),
    latestOpenInvoiceUrl: latestOpen?.hostedInvoiceUrl ?? null,
    canManage: input.canManage,
    usedSeats: input.usedSeats,
    usedClients: input.usedClients,
    overview: input.overview,
    invoices: input.invoices,
  };
}

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
  const unavailableMessage = getPricingUnavailableMessage(stripeStatus);
  const paymentBlockMessage = getPricingPaymentBlockMessage({
    overview: selection.overview,
    invoices: selection.invoices,
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
          {selection.latestOpenInvoiceUrl ? (
            <>
              {" "}
              <a
                href={selection.latestOpenInvoiceUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium underline"
              >
                Open invoice
              </a>
            </>
          ) : null}
          {selection.canManage && stripeStatus.portalAvailable ? (
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
        {plans.map((plan) => {
          const action = resolvePlanActionLabel(
            plan.key,
            selection.currentPlanKey,
            selection.isUsable,
          );
          const isCurrent = action === "current";
          const isDowngrade = action === "downgrade";
          const seatBlock = getPricingPlanBlockReason(
            plan.key,
            selection.usedSeats,
            selection.usedClients,
          );
          const disabledReasons = getPricingButtonDisabledReasons({
            planKey: plan.key,
            currentPlanKey: selection.currentPlanKey,
            isUsable: selection.isUsable,
            hasPaymentProblem: selection.hasPaymentProblem,
            isPaymentPending: selection.isPaymentPending,
            hasOpenUnpaidInvoice: selection.hasOpenUnpaidInvoice,
            overview: selection.overview,
            invoices: selection.invoices,
            canManage: selection.canManage,
            isLoading: isPending && pendingPlanKey === plan.key,
            isCurrent,
            isDowngrade,
            seatBlockMessage: seatBlock.blocked ? seatBlock.message : null,
            stripeStatus,
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
              canManage={selection.canManage}
              seatBlockMessage={seatBlock.blocked ? seatBlock.message : null}
              disabledReasons={disabledReasons}
              isDisabled={isPricingButtonDisabled(plan.key, disabledReasons)}
              stripeStatus={stripeStatus}
              enterpriseContactHref={enterpriseContactHref}
              onSelect={() => {
                if (isDowngrade && selection.isUsable && stripeStatus.portalAvailable) {
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
