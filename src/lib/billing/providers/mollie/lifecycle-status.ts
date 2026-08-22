/**
 * Central Mollie payment + subscription status mapping for Phase 4.
 * Maps real Mollie statuses to canonical organization_subscriptions fields.
 * Never invents Stripe-style proration or cancel-at-period-end theatre.
 */

import { PaymentStatus } from "@mollie/api-client";

/** Canonical normalized statuses written to organization_subscriptions.status */
export type MollieNormalizedSubscriptionStatus =
  | "active"
  | "canceled"
  | "inactive"
  | "past_due"
  | "incomplete";

/**
 * Mollie subscription.status values (API):
 * pending | active | canceled | suspended | completed
 *
 * Mapping:
 * - active → active (recurring / initial after mandate)
 * - pending → incomplete (awaiting first cycle)
 * - suspended → past_due (payment failure / recovery window)
 * - canceled / cancelled → canceled
 * - completed → inactive (finite series finished)
 * - recovered is not a Mollie subscription status — recovery is suspended→active via webhook re-fetch
 */
export function mapMollieSubscriptionStatus(
  status: string | null | undefined,
): MollieNormalizedSubscriptionStatus {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "active";
    case "pending":
      return "incomplete";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "suspended":
      return "past_due";
    case "completed":
      return "inactive";
    case "expired":
      return "inactive";
    case "failed":
      return "past_due";
    default:
      return "inactive";
  }
}

/** Only paid status proceeds to mandate/subscription creation. */
export function isMolliePaymentPaid(status: string | PaymentStatus | null | undefined): boolean {
  return status === PaymentStatus.paid || status === "paid";
}

export function isMolliePaymentTerminalFailure(
  status: string | PaymentStatus | null | undefined,
): boolean {
  return (
    status === PaymentStatus.failed ||
    status === PaymentStatus.canceled ||
    status === PaymentStatus.expired ||
    status === "failed" ||
    status === "canceled" ||
    status === "expired"
  );
}

export function isMolliePaymentPending(
  status: string | PaymentStatus | null | undefined,
): boolean {
  return (
    status === PaymentStatus.open ||
    status === PaymentStatus.pending ||
    status === "open" ||
    status === "pending"
  );
}

/**
 * Whether a Mollie subscription status grants paid entitlements.
 * Only active (and never suspended/canceled/pending).
 */
export function isMollieSubscriptionEntitlementGranting(
  status: string | null | undefined,
): boolean {
  return mapMollieSubscriptionStatus(status) === "active";
}

/**
 * Mollie customerSubscriptions.cancel is immediate on the provider — there is no
 * defer-to-period-end API parameter. Auroranexis tracks cancel_at_period_end locally
 * and preserves paid-through access until current_period_end (see subscription-management.ts).
 */
export const MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END = true as const;

/**
 * Mollie does not expose a "reactivate canceled subscription" API.
 * Recovery after cancel requires a new first-payment → mandate → subscription.
 */
export const MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false as const;

/** Normalize stored status while honoring paid-through cancellation windows. */
export function resolveMollieStoredSubscriptionStatus(input: {
  providerStatus: string | null | undefined;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null | undefined;
  now?: Date;
}): MollieNormalizedSubscriptionStatus {
  const mapped = mapMollieSubscriptionStatus(input.providerStatus);

  if (input.cancelAtPeriodEnd) {
    const end = input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null;
    const now = input.now ?? new Date();
    if (!end || Number.isNaN(end.getTime()) || end > now) {
      return "active";
    }
    return "canceled";
  }

  return mapped;
}
