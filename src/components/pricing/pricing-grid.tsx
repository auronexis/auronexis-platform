"use client";

import { useState, useTransition } from "react";
import { CheckoutBlockBanner } from "@/components/billing/checkout-block-banner";
import {
  CheckoutContractSummaryDialog,
  type CheckoutContractAcceptanceState,
} from "@/components/billing/checkout-contract-summary-dialog";
import { PricingCard } from "@/components/pricing/pricing-card";
import {
  createCheckoutSessionAction,
  createPortalSessionAction,
  prepareCheckoutContractSummaryAction,
} from "@/lib/billing/actions";
import type { CheckoutContractSummary } from "@/lib/billing/contracting";
import type { CheckoutBlockState } from "@/lib/billing/checkout-block";
import { resolveCheckoutBlockState } from "@/lib/billing/checkout-block";
import { sanitizeBillingCustomerError } from "@/lib/billing/errors";
import type { BillingUiStatus } from "@/lib/billing/types";
import {
  formatScheduledPlanChangeSummary,
  getScheduledPlanBadgeLabel,
  resolvePlanCardAction,
} from "@/lib/billing/plan-change";
import {
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
import { normalizeBillingUiStatus } from "@/lib/billing/ui-status-client";
import { FormAlert } from "@/components/ui/form-alert";
import { trackConversionEvent } from "@/lib/analytics/events";

export type { PricingSelectionContext } from "@/lib/pricing/selection-context";
export { buildPricingSelectionContext, createFallbackPricingSelection } from "@/lib/pricing/selection-context";

type PricingGridProps = {
  plans: SubscriptionPlanDefinition[];
  selection: PricingSelectionContext;
  stripeStatus: BillingUiStatus;
  enterpriseContactHref: string;
  checkoutBlock?: CheckoutBlockState;
  canManage?: boolean;
  /** When false, do not offer portal CTA (no verified customer portal yet). */
  showPortalAction?: boolean;
  /** Optional catalog display strings keyed by plan key. */
  localizedDisplayPrices?: Partial<Record<PlanKey, string>>;
};

const INITIAL_ACCEPTANCE: CheckoutContractAcceptanceState = {
  termsAccepted: false,
  b2bEntrepreneurConfirmed: false,
  countryCode: "DE",
  vatId: "",
};

export function PricingGrid({
  plans,
  selection,
  stripeStatus,
  enterpriseContactHref,
  checkoutBlock,
  canManage = false,
  showPortalAction = true,
  localizedDisplayPrices,
}: PricingGridProps) {
  const [pendingPlanKey, setPendingPlanKey] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingSyncMessage, setPendingSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPortalPending, startPortalTransition] = useTransition();
  const [contractOpen, setContractOpen] = useState(false);
  const [contractSummary, setContractSummary] = useState<CheckoutContractSummary | null>(null);
  const [acceptance, setAcceptance] = useState<CheckoutContractAcceptanceState>(INITIAL_ACCEPTANCE);
  const [contractError, setContractError] = useState<string | null>(null);
  const safeStripeStatus = normalizeBillingUiStatus(stripeStatus);
  const safeSelection = selection ?? createFallbackPricingSelection();
  const safePlans = Array.isArray(plans) ? plans : [];
  const scheduledPlanChange = safeSelection.overview.scheduledPlanChange ?? null;
  const unavailableMessage = getPricingUnavailableMessage(safeStripeStatus);
  const resolvedCheckoutBlock =
    checkoutBlock ??
    resolveCheckoutBlockState({
      overview: safeSelection.overview,
      invoices: safeSelection.invoices ?? [],
    });

  const selectPlan = (planKey: PlanKey) => {
    setError(null);
    setPendingSyncMessage(null);
    setContractError(null);
    setPendingPlanKey(planKey);
    setAcceptance(INITIAL_ACCEPTANCE);
    trackConversionEvent("subscription_checkout_started", {
      surface: "pricing_grid",
      plan_tier: planKey,
    });
    startTransition(async () => {
      const prepared = await prepareCheckoutContractSummaryAction(planKey);
      if (prepared.error || !prepared.summary) {
        setError(
          sanitizeBillingCustomerError(
            new Error(prepared.error ?? "Unable to prepare checkout."),
            "Unable to start checkout.",
          ),
        );
        setPendingPlanKey(null);
        return;
      }
      setContractSummary(prepared.summary);
      setContractOpen(true);
    });
  };

  const confirmContractCheckout = () => {
    if (!pendingPlanKey) return;
    setContractError(null);
    startTransition(async () => {
      const result = await createCheckoutSessionAction(pendingPlanKey, {
        termsAccepted: acceptance.termsAccepted,
        b2bEntrepreneurConfirmed: acceptance.b2bEntrepreneurConfirmed,
        countryCode: acceptance.countryCode,
        vatId: acceptance.vatId.trim() || undefined,
      });
      if (result?.error) {
        setContractError(
          sanitizeBillingCustomerError(new Error(result.error), "Unable to start checkout."),
        );
        return;
      }

      if (result?.mollieCheckout?.checkoutUrl) {
        setPendingSyncMessage(result.mollieCheckout.pendingSyncMessage);
        window.location.assign(result.mollieCheckout.checkoutUrl);
        return;
      }

      if (result?.success) {
        setContractOpen(false);
        setPendingSyncMessage(result.success);
        setPendingPlanKey(null);
        return;
      }

      setContractOpen(false);
      setPendingPlanKey(null);
    });
  };

  const openPortal = () => {
    if (!showPortalAction) {
      setError("A billing portal will be available after your first completed subscription.");
      return;
    }
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
          showPortalAction={showPortalAction}
          onOpenPortal={openPortal}
          isPortalPending={isPortalPending}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {safePlans.map((plan) => {
          const action = resolvePlanCardAction(
            plan.key,
            safeSelection.currentPlanKey,
            safeSelection.isUsable,
            scheduledPlanChange,
          );
          const isCurrent = safeSelection.isUsable && action === "current";
          const isScheduledTarget = action === "scheduled";
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
            billingProvider: safeSelection.billingProvider ?? null,
            scheduledPlanChange,
          });

          return (
            <PricingCard
              key={plan.key}
              plan={plan}
              action={action}
              isCurrent={isCurrent}
              isScheduledTarget={isScheduledTarget}
              scheduledBadge={
                isScheduledTarget && scheduledPlanChange
                  ? getScheduledPlanBadgeLabel(scheduledPlanChange.changeType)
                  : null
              }
              scheduledEffectiveDate={scheduledPlanChange?.effectiveAtLabel ?? null}
              changeType={scheduledPlanChange?.changeType}
              isLoading={
                (isPending && pendingPlanKey === plan.key) ||
                (isPortalPending && isDowngrade)
              }
              canManage={safeSelection.canManage}
              seatBlockMessage={seatBlock.blocked ? seatBlock.message : null}
              blockedCheckoutMessage={
                resolvedCheckoutBlock.blocked
                  ? (resolvedCheckoutBlock.bannerMessage ?? resolvedCheckoutBlock.message)
                  : null
              }
              disabledReasons={disabledReasons}
              isDisabled={isPricingButtonDisabled(plan.key, disabledReasons)}
              stripeStatus={safeStripeStatus}
              enterpriseContactHref={enterpriseContactHref}
              displayPrice={localizedDisplayPrices?.[plan.key] ?? null}
              onSelect={() => {
                if (isScheduledTarget) {
                  return;
                }
                if (
                  isDowngrade &&
                  safeSelection.isUsable &&
                  safeStripeStatus.portalAvailable &&
                  showPortalAction &&
                  safeSelection.billingProvider !== "mollie"
                ) {
                  openPortal();
                  return;
                }
                selectPlan(plan.key);
              }}
            />
          );
        })}
      </div>

      <CheckoutContractSummaryDialog
        open={contractOpen}
        summary={contractSummary}
        acceptance={acceptance}
        onAcceptanceChange={setAcceptance}
        onConfirm={confirmContractCheckout}
        onCancel={() => {
          setContractOpen(false);
          setPendingPlanKey(null);
          setContractError(null);
        }}
        pending={isPending}
        error={contractError}
      />

      {pendingSyncMessage ? <FormAlert variant="success">{pendingSyncMessage}</FormAlert> : null}
      {!pendingSyncMessage && scheduledPlanChange ? (
        <FormAlert variant="success">
          {formatScheduledPlanChangeSummary(scheduledPlanChange)}
        </FormAlert>
      ) : null}
      {safeSelection.overview.cancelAtPeriodEnd && safeSelection.overview.scheduledCancellationDate ? (
        <FormAlert variant="warning">
          Cancellation scheduled — access until {safeSelection.overview.scheduledCancellationDate}.
          Plan changes are unavailable until cancellation is resolved.
        </FormAlert>
      ) : null}
      {error ? <FormAlert variant="warning">{error}</FormAlert> : null}
    </div>
  );
}
