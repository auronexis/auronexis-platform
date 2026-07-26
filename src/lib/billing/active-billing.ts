/**
 * Active-billing helpers for the configured checkout provider.
 * Historical Stripe rows may remain in the database but must not drive
 * checkout, portal, entitlements, or preferred-row selection.
 *
 * After FastSpring cutover:
 * - NEW checkouts use FastSpring
 * - usable legacy Paddle rows continue to grant access
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

export function isFastSpringBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  return row?.billing_provider === "fastspring";
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

export function hasVerifiedFastSpringSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isFastSpringBackedSubscription(row)) {
    return false;
  }
  return Boolean(row?.provider_subscription_id?.trim());
}

/** Stripe-backed or legacy Stripe row (default provider / Stripe ids without Paddle/FastSpring). */
export function isStripeBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row) {
    return false;
  }
  if (row.billing_provider === "paddle" || row.billing_provider === "fastspring") {
    return false;
  }
  return (
    row.billing_provider === "stripe" ||
    Boolean(row.stripe_customer_id || row.stripe_subscription_id || row.stripe_price_id)
  );
}

/**
 * Abandoned Stripe checkout remnant that must never block active billing.
 */
export function isStaleStripeAbandonedCheckout(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row || !isStripeBackedSubscription(row)) {
    return false;
  }

  if (
    hasVerifiedPaddleSubscription(row) ||
    isPaddleBackedSubscription(row) ||
    isFastSpringBackedSubscription(row)
  ) {
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

  if (isStaleStripeAbandonedCheckout(row)) {
    return false;
  }

  if (activeProvider === "fastspring") {
    // FastSpring cutover: accept FastSpring rows and usable/legacy Paddle rows.
    if (isFastSpringBackedSubscription(row) || isPaddleBackedSubscription(row)) {
      return true;
    }
    return false;
  }

  if (activeProvider === "paddle") {
    if (isStripeBackedSubscription(row) && !isPaddleBackedSubscription(row)) {
      return false;
    }
    return isPaddleBackedSubscription(row);
  }

  // Stripe archive mode (should not be active): ignore pure Paddle/FastSpring without Stripe ids.
  if (
    (isPaddleBackedSubscription(row) || isFastSpringBackedSubscription(row)) &&
    !row.stripe_subscription_id
  ) {
    return false;
  }
  return true;
}

/**
 * Status fields that affect checkout / portal / plan display for the active provider.
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

  if (activeProvider === "fastspring") {
    if (isPaddleBackedSubscription(row)) {
      const status = row.provider_status ?? row.status;
      return {
        rawStatus: status,
        isUsable: isSubscriptionUsable(status),
        hasPaymentProblem: isPaymentProblem(status),
        isPaymentPending: Boolean(row.sync_pending) || isPaymentPending(status),
        hasSubscription: hasVerifiedPaddleSubscription(row),
      };
    }

    const status = row.provider_status ?? row.status;
    return {
      rawStatus: status,
      isUsable: isSubscriptionUsable(status),
      hasPaymentProblem: isPaymentProblem(status),
      isPaymentPending: Boolean(row.sync_pending) || isPaymentPending(status),
      hasSubscription: hasVerifiedFastSpringSubscription(row),
    };
  }

  if (activeProvider === "paddle") {
    const status = row.provider_status ?? row.status;
    return {
      rawStatus: status,
      isUsable: isSubscriptionUsable(status),
      hasPaymentProblem: isPaymentProblem(status),
      isPaymentPending: Boolean(row.sync_pending) || isPaymentPending(status),
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

/** Whether verified provider state alone justifies blocking new checkout. */
export function paddleSubscriptionBlocksCheckout(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isPaddleBackedSubscription(row) && !isFastSpringBackedSubscription(row)) {
    return false;
  }

  if (row?.sync_pending) {
    return true;
  }

  const status = row?.provider_status ?? row?.status;
  const hasSub =
    (isPaddleBackedSubscription(row) && hasVerifiedPaddleSubscription(row)) ||
    (isFastSpringBackedSubscription(row) && hasVerifiedFastSpringSubscription(row));

  if (isPaymentProblem(status) && hasSub) {
    return true;
  }

  if (isPaymentPending(status) && hasSub) {
    return true;
  }

  return false;
}

/** Portal eligibility for legacy Paddle customers only. */
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

export const FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE =
  "Subscription changes for FastSpring billing are managed through FastSpring purchase emails or by contacting support. Legacy Paddle customers can still open the Paddle portal when available.";
