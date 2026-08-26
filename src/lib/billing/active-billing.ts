/**
 * Active-billing helpers for the configured checkout provider.
 * Historical legacy rows may remain in the database but must never drive
 * checkout, portal, entitlements, or preferred-row selection.
 *
 * Mollie is the sole active billing provider. Legacy provider detection
 * helpers exist only for historical labeling/diagnostics — they must never
 * be used to grant portal access, checkout eligibility, or entitlements.
 */

import { isLegacyQuarantinedSubscriptionRow } from "@/lib/billing/legacy-quarantine";
import type { BillingProvider } from "@/lib/billing/provider-types";
import {
  isPaymentPending,
  isPaymentProblem,
  isSubscriptionUsable,
  normalizeSubscriptionStatus,
} from "@/lib/billing/status";
import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import type { OrganizationSubscription } from "@/types/database";

const ABANDONED_CHECKOUT_STATUSES = new Set([
  "incomplete",
  "incomplete_expired",
  "pending",
  "processing",
]);

/** True when the row is explicitly Paddle-backed (historical detection only). */
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

export function isMollieBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  return row?.billing_provider === "mollie";
}

/** True when a verified Paddle customer id is present (historical detection only). */
export function hasVerifiedPaddleCustomer(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isPaddleBackedSubscription(row)) {
    return false;
  }
  const customerId = row?.provider_customer_id?.trim() ?? "";
  return customerId.startsWith("ctm_");
}

/** True when a verified Paddle subscription id is present (historical detection only). */
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

export function hasVerifiedMollieCustomer(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isMollieBackedSubscription(row)) {
    return false;
  }
  const customerId = row?.provider_customer_id?.trim() ?? "";
  return customerId.startsWith("cst_");
}

export function hasVerifiedMollieSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!isMollieBackedSubscription(row)) {
    return false;
  }
  const subscriptionId = row?.provider_subscription_id?.trim() ?? "";
  return subscriptionId.startsWith("sub_");
}

/** Stripe-backed or legacy Stripe row (default provider / Stripe ids without Paddle/FastSpring). */
export function isStripeBackedSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row) {
    return false;
  }
  if (
    row.billing_provider === "paddle" ||
    row.billing_provider === "fastspring" ||
    row.billing_provider === "mollie"
  ) {
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

  if (isLegacyQuarantinedSubscriptionRow(row)) {
    return false;
  }

  if (isStaleStripeAbandonedCheckout(row)) {
    return false;
  }

  if (activeProvider === "fastspring") {
    // FastSpring is the sole global default — Paddle rows are historical only
    // and never drive active billing, checkout, portal, or entitlements.
    return isFastSpringBackedSubscription(row);
  }

  if (activeProvider === "mollie") {
    return isMollieBackedSubscription(row);
  }

  if (activeProvider === "paddle") {
    if (isStripeBackedSubscription(row) && !isPaddleBackedSubscription(row)) {
      return false;
    }
    return isPaddleBackedSubscription(row);
  }

  // Stripe archive mode (should not be active): ignore pure Paddle/FastSpring/Mollie without Stripe ids.
  if (
    (isPaddleBackedSubscription(row) ||
      isFastSpringBackedSubscription(row) ||
      isMollieBackedSubscription(row)) &&
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

  if (activeProvider === "fastspring" || activeProvider === "mollie" || activeProvider === "paddle") {
    const status = row.provider_status ?? row.status;
    const hasSubscription =
      activeProvider === "fastspring"
        ? hasVerifiedFastSpringSubscription(row)
        : activeProvider === "mollie"
          ? hasVerifiedMollieSubscription(row)
          : hasVerifiedPaddleSubscription(row);
    const isUsable =
      activeProvider === "mollie"
        ? resolveSubscriptionUsability(row, status)
        : isSubscriptionUsable(status);
    return {
      rawStatus: status,
      isUsable,
      hasPaymentProblem: isPaymentProblem(status),
      isPaymentPending: Boolean(row.sync_pending) || isPaymentPending(status),
      hasSubscription,
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

/** Whether verified active-provider state alone justifies blocking new checkout. */
export function providerSubscriptionBlocksCheckout(
  row: OrganizationSubscription | null | undefined,
): boolean {
  const isProviderRow =
    isFastSpringBackedSubscription(row) || isMollieBackedSubscription(row);
  if (!isProviderRow) {
    return false;
  }

  if (row?.sync_pending) {
    return true;
  }

  const status = row?.provider_status ?? row?.status;
  const hasSub = isFastSpringBackedSubscription(row)
    ? hasVerifiedFastSpringSubscription(row)
    : hasVerifiedMollieSubscription(row);

  if (isPaymentProblem(status) && hasSub) {
    return true;
  }

  if (isPaymentPending(status) && hasSub) {
    return true;
  }

  return false;
}

export const BILLING_PORTAL_UNAVAILABLE_MESSAGE =
  "A hosted billing portal is not available. Manage your subscription in Settings → Billing, or contact support.";

/** @deprecated Use BILLING_PORTAL_UNAVAILABLE_MESSAGE — FastSpring portal is retired. */
export const FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE = BILLING_PORTAL_UNAVAILABLE_MESSAGE;
