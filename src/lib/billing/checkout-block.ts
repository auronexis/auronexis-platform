import {
  paddleSubscriptionBlocksCheckout,
} from "@/lib/billing/active-billing";
import type { BillingProvider } from "@/lib/billing/provider-types";
import type { BillingOverview, CustomerInvoiceView } from "@/lib/billing/types";
import { findLatestOpenInvoice } from "@/lib/billing/status";

export const OPEN_INVOICE_CHECKOUT_BLOCK_MESSAGE =
  "Checkout is blocked because an unpaid invoice is open.";

export const PAYMENT_PROBLEM_CHECKOUT_BLOCK_MESSAGE =
  "Checkout is blocked until your subscription payment issue is resolved.";

export const PAYMENT_PENDING_CHECKOUT_BLOCK_MESSAGE =
  "Checkout is blocked while a payment is still processing.";

export type CheckoutBlockCode =
  | "open_unpaid_invoice"
  | "payment_problem"
  | "payment_pending"
  | "none";

export type CheckoutBlockState = {
  blocked: boolean;
  code: CheckoutBlockCode;
  message: string | null;
  /** Customer-facing summary for billing/plans banners. */
  bannerMessage: string | null;
  blockingInvoice: CustomerInvoiceView | null;
  blockingInvoiceStripeId: string | null;
  hostedInvoiceUrl: string | null;
};

function isBlockingOpenInvoice(
  invoice: CustomerInvoiceView,
  ignoredStripeInvoiceIds?: ReadonlySet<string>,
): boolean {
  if (ignoredStripeInvoiceIds?.has(invoice.stripeInvoiceId)) {
    return false;
  }

  return invoice.status === "open" && invoice.amountPaid === 0;
}

/**
 * Resolve whether checkout should be blocked.
 * When activeProvider is paddle, Stripe invoices and Stripe subscription remnants
 * never block — only verified Paddle state may block.
 */
export function resolveCheckoutBlockState(input: {
  overview: BillingOverview;
  invoices: CustomerInvoiceView[];
  ignoredStripeInvoiceIds?: ReadonlySet<string>;
  activeProvider?: BillingProvider;
}): CheckoutBlockState {
  const activeProvider = input.activeProvider ?? "stripe";

  if (activeProvider === "paddle") {
    const subscription = input.overview.subscription;

    if (paddleSubscriptionBlocksCheckout(subscription)) {
      if (input.overview.hasPaymentProblem) {
        return {
          blocked: true,
          code: "payment_problem",
          message: PAYMENT_PROBLEM_CHECKOUT_BLOCK_MESSAGE,
          bannerMessage: PAYMENT_PROBLEM_CHECKOUT_BLOCK_MESSAGE,
          blockingInvoice: null,
          blockingInvoiceStripeId: null,
          hostedInvoiceUrl: null,
        };
      }

      return {
        blocked: true,
        code: "payment_pending",
        message: PAYMENT_PENDING_CHECKOUT_BLOCK_MESSAGE,
        bannerMessage: PAYMENT_PENDING_CHECKOUT_BLOCK_MESSAGE,
        blockingInvoice: null,
        blockingInvoiceStripeId: null,
        hostedInvoiceUrl: null,
      };
    }

    // Stripe open invoices and incomplete Stripe rows never block Paddle checkout.
    return {
      blocked: false,
      code: "none",
      message: null,
      bannerMessage: null,
      blockingInvoice: null,
      blockingInvoiceStripeId: null,
      hostedInvoiceUrl: null,
    };
  }

  const invoices = Array.isArray(input.invoices) ? input.invoices : [];
  const blockingInvoice =
    invoices.find((invoice) => isBlockingOpenInvoice(invoice, input.ignoredStripeInvoiceIds)) ??
    null;

  if (blockingInvoice) {
    return {
      blocked: true,
      code: "open_unpaid_invoice",
      message: `${OPEN_INVOICE_CHECKOUT_BLOCK_MESSAGE} Invoice ${blockingInvoice.stripeInvoiceId} is open with no payment.`,
      bannerMessage: OPEN_INVOICE_CHECKOUT_BLOCK_MESSAGE,
      blockingInvoice,
      blockingInvoiceStripeId: blockingInvoice.stripeInvoiceId,
      hostedInvoiceUrl: blockingInvoice.hostedInvoiceUrl,
    };
  }

  if (input.overview.hasPaymentProblem) {
    return {
      blocked: true,
      code: "payment_problem",
      message: PAYMENT_PROBLEM_CHECKOUT_BLOCK_MESSAGE,
      bannerMessage: PAYMENT_PROBLEM_CHECKOUT_BLOCK_MESSAGE,
      blockingInvoice: null,
      blockingInvoiceStripeId: null,
      hostedInvoiceUrl: findLatestOpenInvoice(invoices)?.hostedInvoiceUrl ?? null,
    };
  }

  if (input.overview.isPaymentPending) {
    return {
      blocked: true,
      code: "payment_pending",
      message: PAYMENT_PENDING_CHECKOUT_BLOCK_MESSAGE,
      bannerMessage: PAYMENT_PENDING_CHECKOUT_BLOCK_MESSAGE,
      blockingInvoice: null,
      blockingInvoiceStripeId: null,
      hostedInvoiceUrl: findLatestOpenInvoice(invoices)?.hostedInvoiceUrl ?? null,
    };
  }

  return {
    blocked: false,
    code: "none",
    message: null,
    bannerMessage: null,
    blockingInvoice: null,
    blockingInvoiceStripeId: null,
    hostedInvoiceUrl: null,
  };
}

export type BillingProductionHealth = "healthy" | "needs_attention";

export function resolveBillingProductionHealth(input: {
  checkoutBlock: CheckoutBlockState;
  recommendationCount: number;
  dangerRecommendationCount: number;
}): BillingProductionHealth {
  if (
    input.checkoutBlock.blocked ||
    input.dangerRecommendationCount > 0 ||
    input.recommendationCount > 0
  ) {
    return "needs_attention";
  }

  return "healthy";
}
