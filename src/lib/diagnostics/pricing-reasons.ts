import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  isCheckoutBlockedByPaymentState,
  PENDING_PAYMENT_CHECKOUT_MESSAGE,
} from "@/lib/billing/checkout-guards";
import type { BillingOverview, CustomerInvoiceView, StripeBillingUiStatus } from "@/lib/billing/types";

function comparePlanOrder(
  targetKey: PlanKey,
  currentPlanKey: PlanKey | string | null | undefined,
): "upgrade" | "downgrade" | "same" | "unknown" {
  const target = safeGetPlanByKey(targetKey);
  const current = safeGetPlanByKey(currentPlanKey);

  if (!target || !current) {
    return "unknown";
  }

  if (target.order === current.order) {
    return "same";
  }

  return target.order > current.order ? "upgrade" : "downgrade";
}

export function getPricingButtonDisabledReasons(input: {
  planKey: PlanKey;
  currentPlanKey: PlanKey | string | null | undefined;
  isUsable: boolean;
  hasPaymentProblem?: boolean;
  isPaymentPending?: boolean;
  hasOpenUnpaidInvoice?: boolean;
  overview?: BillingOverview;
  invoices?: CustomerInvoiceView[];
  canManage: boolean;
  isLoading: boolean;
  isCurrent: boolean;
  isDowngrade: boolean;
  seatBlockMessage: string | null;
  stripeStatus: StripeBillingUiStatus;
}): string[] {
  const reasons: string[] = [];

  if (input.planKey === "enterprise") {
    return reasons;
  }

  if (!input.canManage) {
    reasons.push("Organization owners and admins can change plans.");
  }

  if (input.isCurrent) {
    reasons.push("This is your organization's current plan.");
  }

  const paymentBlocked =
    input.overview && input.invoices
      ? isCheckoutBlockedByPaymentState({
          overview: input.overview,
          invoices: input.invoices,
        })
      : Boolean(
          input.hasPaymentProblem || input.isPaymentPending || input.hasOpenUnpaidInvoice,
        );

  if (paymentBlocked) {
    reasons.push(PENDING_PAYMENT_CHECKOUT_MESSAGE);
  }

  if (input.isUsable && input.isDowngrade && !input.isCurrent && !input.stripeStatus.portalAvailable) {
    reasons.push("Use the billing portal to downgrade — portal is currently unavailable.");
  }

  if (input.isUsable && input.currentPlanKey && !input.isCurrent && !input.isDowngrade) {
    const comparison = comparePlanOrder(input.planKey, input.currentPlanKey);
    if (comparison === "same" || comparison === "downgrade") {
      reasons.push("Use the billing portal to manage your current subscription.");
    }
  }

  if (input.isLoading) {
    reasons.push("Checkout is in progress.");
  }

  if (input.seatBlockMessage) {
    reasons.push(input.seatBlockMessage);
  }

  if (!input.stripeStatus?.planCheckoutReady?.[input.planKey]) {
    if (!input.stripeStatus.checkoutAvailable) {
      reasons.push("Billing is currently unavailable.");
    } else {
      reasons.push("Checkout temporarily unavailable.");
    }
  }

  return reasons;
}

export function isPricingButtonDisabled(
  planKey: PlanKey,
  reasons: string[],
): boolean {
  if (planKey === "enterprise") {
    return false;
  }

  return reasons.length > 0;
}

export function getPricingUnavailableMessage(stripeStatus: StripeBillingUiStatus | null | undefined): string | null {
  if (stripeStatus?.checkoutAvailable) {
    return null;
  }

  return "Billing is currently unavailable. Contact sales if you need help choosing a plan.";
}

export function getPlanCheckoutHint(
  planKey: PlanKey,
  stripeStatus: StripeBillingUiStatus | null | undefined,
): string | null {
  if (planKey === "enterprise") {
    return null;
  }

  if (stripeStatus?.planCheckoutReady?.[planKey]) {
    return null;
  }

  if (!stripeStatus?.checkoutAvailable) {
    return "Billing is currently unavailable.";
  }

  return "Checkout temporarily unavailable.";
}

export function getPlanDisplayName(planKey: PlanKey | string | null | undefined): string {
  return safeGetPlanByKey(planKey)?.name ?? "Plan";
}

export function getPricingPaymentBlockMessage(input: {
  overview?: BillingOverview | null;
  invoices?: CustomerInvoiceView[] | null;
}): string | null {
  if (!input.overview) {
    return null;
  }

  if (!isCheckoutBlockedByPaymentState({
    overview: input.overview,
    invoices: Array.isArray(input.invoices) ? input.invoices : [],
  })) {
    return null;
  }

  return PENDING_PAYMENT_CHECKOUT_MESSAGE;
}
