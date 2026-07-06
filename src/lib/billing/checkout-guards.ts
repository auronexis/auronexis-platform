import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";

export const PENDING_PAYMENT_CHECKOUT_MESSAGE =
  "You already have a pending payment. Open invoice or billing portal.";

export type CheckoutGuardResult = {
  allowed: boolean;
  reason: string | null;
};

export function hasOpenUnpaidInvoice(invoices: CustomerInvoiceView[]): boolean {
  return invoices.some((invoice) => invoice.status === "open" && invoice.amountPaid === 0);
}

export function isCheckoutBlockedByPaymentState(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
}): boolean {
  return (
    input.overview.hasPaymentProblem ||
    input.overview.isPaymentPending ||
    hasOpenUnpaidInvoice(input.invoices)
  );
}

/** Server and client-safe checkout guard evaluation. */
export function evaluateCheckoutGuard(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  targetPlanKey: PlanKey;
}): CheckoutGuardResult {
  if (isCheckoutBlockedByPaymentState(input)) {
    return {
      allowed: false,
      reason: PENDING_PAYMENT_CHECKOUT_MESSAGE,
    };
  }

  if (input.overview.isUsable && input.overview.currentPlanKey) {
    const target = getPlanByKey(input.targetPlanKey);
    const current = getPlanByKey(input.overview.currentPlanKey);

    if (target.key === current.key) {
      return {
        allowed: false,
        reason: "This is your organization's current plan.",
      };
    }

    if (target.order <= current.order) {
      return {
        allowed: false,
        reason: "Use the billing portal to downgrade or manage your current subscription.",
      };
    }
  }

  return { allowed: true, reason: null };
}
