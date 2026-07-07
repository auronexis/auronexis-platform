import { safeGetPlanByKey, type PlanKey } from "@/lib/billing/plans";
import {
  resolveCheckoutBlockState,
  type CheckoutBlockState,
} from "@/lib/billing/checkout-block";
import type { BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";

export const PENDING_PAYMENT_CHECKOUT_MESSAGE =
  "You already have a pending payment. Open invoice or billing portal.";

export { OPEN_INVOICE_CHECKOUT_BLOCK_MESSAGE } from "@/lib/billing/checkout-block";

export type CheckoutGuardResult = {
  allowed: boolean;
  reason: string | null;
};

export function hasOpenUnpaidInvoice(
  invoices: CustomerInvoiceView[],
  ignoredStripeInvoiceIds?: ReadonlySet<string>,
): boolean {
  return invoices.some(
    (invoice) =>
      invoice.status === "open" &&
      invoice.amountPaid === 0 &&
      !ignoredStripeInvoiceIds?.has(invoice.stripeInvoiceId),
  );
}

export function isCheckoutBlockedByPaymentState(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  ignoredStripeInvoiceIds?: ReadonlySet<string>;
}): boolean {
  return resolveCheckoutBlockState(input).blocked;
}

export function getCheckoutBlockState(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  ignoredStripeInvoiceIds?: ReadonlySet<string>;
}): CheckoutBlockState {
  return resolveCheckoutBlockState(input);
}

/** Server and client-safe checkout guard evaluation. Never throws. */
export function evaluateCheckoutGuard(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  targetPlanKey: PlanKey;
  ignoredStripeInvoiceIds?: ReadonlySet<string>;
}): CheckoutGuardResult {
  if (isCheckoutBlockedByPaymentState(input)) {
    const block = getCheckoutBlockState(input);
    return {
      allowed: false,
      reason: block.bannerMessage ?? block.message ?? PENDING_PAYMENT_CHECKOUT_MESSAGE,
    };
  }

  if (input.overview.isUsable && input.overview.currentPlanKey) {
    const target = safeGetPlanByKey(input.targetPlanKey);
    const current = safeGetPlanByKey(input.overview.currentPlanKey);

    if (!target || !current) {
      return { allowed: true, reason: null };
    }

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
