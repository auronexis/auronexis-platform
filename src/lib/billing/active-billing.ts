/**
 * Active-billing helpers for the configured checkout provider.
 * Historical Stripe rows may remain in the database but must not drive
 * checkout, portal, entitlements, or preferred-row selection when Paddle is active.
 */

import type { BillingProvider } from "@/lib/billing/provider-types";
import {
  isPaymentPending,
  isPaymentProblem,
  isSubscriptionUsable,
  normalizeSubscriptionStatus,
} from "@/lib/billing/status";
import type { OrganizationSubscription } from "@/types/database";

const ABANDONED_CHECKOUT_STATUSES = new Set([
  "incomplete",
  "incomplete_expired",
  "pending",
  "processing",
]);

/** True when the row is explicitly Paddle-backed (not a copied Stripe ID). */
export function isPaddleBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  return row?.billing_provider === "paddle";
}

/** True when a verified Paddle customer id is present on a Paddle-backed row. */
export function hasVerifiedPaddleCustomer(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isPaddleBackedSubscription(row)) {
    return false;
  }
  const customerId = row?.provider_customer_id?.trim() ?? "";
  return customerId.startsWith("ctm_");
}

/** True when a verified Paddle subscription id is present on a Paddle-backed row. */
export function hasVerifiedPaddleSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isPaddleBackedSubscription(row)) {
    return false;
  }
  const subscriptionId = row?.provider_subscription_id?.trim() ?? "";
  return subscriptionId.startsWith("sub_");
}

/** Stripe-backed or legacy Stripe row (default provider / Stripe ids without Paddle). */
export function isStripeBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row) {
    return false;
  }
  if (row.billing_provider === "paddle") {
    return false;
  }
  return (
    row.billing_provider === "stripe" ||
    Boolean(row.stripe_customer_id || row.stripe_subscription_id || row.stripe_price_id)
  );
}

/**
 * Abandoned Stripe checkout remnant that must never block Paddle.
 * Requires: Stripe-backed, non-active abandoned status, no Stripe subscription id,
 * no verified Paddle subscription.
 */
export function isStaleStripeAbandonedCheckout(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row || !isStripeBackedSubscription(row)) {
    return false;
  }

  if (hasVerifiedPaddleSubscription(row) || isPaddleBackedSubscription(row)) {
    return false;
  }

  if (row.stripe_subscription_id?.trim()) {
    return false;
  }

  if (isSubscriptionUsable(row.status)) {
    return false;
  }

  const status = normalizeSubscriptionStatus(row.status);
  return ABANDONED_CHECKOUT_STATUSES.has(status);
}

/** Whether this row may drive active billing for the configured provider. */
export function isActiveBillingSubscriptionRow(
  row: OrganizationSubscription | null | undefined,
  activeProvider: BillingProvider,
): boolean {
  if (!row) {
    return false;
  }

  if (activeProvider === "paddle") {
    if (isStaleStripeAbandonedCheckout(row)) {
      return false;
    }
    if (isStripeBackedSubscription(row) && !isPaddleBackedSubscription(row)) {
      return false;
    }
    return isPaddleBackedSubscription(row);
  }

  // Stripe mode: ignore pure Paddle rows for preferred active billing.
  if (isPaddleBackedSubscription(row) && !row.stripe_subscription_id) {
    return false;
  }
  return true;
}

/**
 * Status fields that affect checkout / portal / plan display for the active provider.
 * Stripe incomplete remnants are neutralized when Paddle is active.
 */
export function resolveActiveBillingStatusFlags(
  row: OrganizationSubscription | null | undefined,
  activeProvider: BillingProvider,
): {
  rawStatus: string | null;
  isUsable: boolean;
  hasPaymentProblem: boolean;
  isPaymentPending: boolean;
  hasSubscription: boolean;
} {
  if (!row || !isActiveBillingSubscriptionRow(row, activeProvider)) {
    return {
      rawStatus: null,
      isUsable: false,
      hasPaymentProblem: false,
      isPaymentPending: false,
      hasSubscription: false,
    };
  }

  if (activeProvider === "paddle") {
    const status = row.provider_status ?? row.status;
    return {
      rawStatus: status,
      isUsable: isSubscriptionUsable(status),
      hasPaymentProblem: isPaymentProblem(status),
      isPaymentPending:
        Boolean(row.sync_pending) || isPaymentPending(status),
      hasSubscription: hasVerifiedPaddleSubscription(row),
    };
  }

  return {
    rawStatus: row.status,
    isUsable: isSubscriptionUsable(row.status),
    hasPaymentProblem: isPaymentProblem(row.status),
    isPaymentPending: isPaymentPending(row.status),
    hasSubscription: Boolean(row.stripe_subscription_id),
  };
}

/** Whether verified Paddle state alone justifies blocking new checkout. */
export function paddleSubscriptionBlocksCheckout(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isPaddleBackedSubscription(row)) {
    return false;
  }

  // Checkout opened / webhook reconciliation in flight.
  if (row?.sync_pending) {
    return true;
  }

  const status = row?.provider_status ?? row?.status;

  if (isPaymentProblem(status) && hasVerifiedPaddleSubscription(row)) {
    return true;
  }

  if (isPaymentPending(status) && hasVerifiedPaddleSubscription(row)) {
    return true;
  }

  return false;
}

/** Portal eligibility when Paddle is the active configured provider. */
export function canOpenPaddleBillingPortal(input: {
  canManage: boolean;
  portalAvailable: boolean;
  subscription: OrganizationSubscription | null | undefined;
}): boolean {
  if (!input.canManage || !input.portalAvailable) {
    return false;
  }
  return hasVerifiedPaddleCustomer(input.subscription);
}

export const PADDLE_PORTAL_UNAVAILABLE_MESSAGE =
  "A billing portal will be available after your first completed subscription.";
