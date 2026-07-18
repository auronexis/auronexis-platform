import {
  hasVerifiedPaddleSubscription,
  isActiveBillingSubscriptionRow,
  isPaddleBackedSubscription,
  isStaleStripeAbandonedCheckout,
} from "@/lib/billing/active-billing";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { isSubscriptionUsable } from "@/lib/billing/status";
import type { OrganizationSubscription } from "@/types/database";

function sortByUpdatedAtDesc(
  a: OrganizationSubscription,
  b: OrganizationSubscription,
): number {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

/**
 * Pick the best subscription row for active billing.
 * When activeProvider is paddle, Stripe-backed / abandoned Stripe rows are never preferred.
 */
export function selectPreferredSubscriptionRow(
  rows: OrganizationSubscription[],
  activeProvider: BillingProvider = "paddle",
): OrganizationSubscription | null {
  if (rows.length === 0) {
    return null;
  }

  const candidates = rows
    .filter((row) => isActiveBillingSubscriptionRow(row, activeProvider))
    .sort(sortByUpdatedAtDesc);

  if (activeProvider === "paddle") {
    const usablePaddle = candidates.find(
      (row) =>
        isPaddleBackedSubscription(row) &&
        isSubscriptionUsable(row.provider_status ?? row.status),
    );
    if (usablePaddle) {
      return usablePaddle;
    }

    const withPaddleSubscription = candidates.find((row) => hasVerifiedPaddleSubscription(row));
    if (withPaddleSubscription) {
      return withPaddleSubscription;
    }

    const newestPaddle = candidates.find((row) => isPaddleBackedSubscription(row));
    if (newestPaddle) {
      return newestPaddle;
    }

    // No Paddle row — do not fall back to stale Stripe remnants.
    return null;
  }

  const usable = candidates.find((row) => isSubscriptionUsable(row.status));
  if (usable) {
    return usable;
  }

  const withoutAbandoned = candidates.find((row) => !isStaleStripeAbandonedCheckout(row));
  return withoutAbandoned ?? candidates[0] ?? null;
}

export function selectPreferredSubscriptionSummaryRow<
  T extends { status: string | null; updated_at?: string },
>(rows: T[], activeProvider: BillingProvider = "paddle"): T | null {
  if (rows.length === 0) {
    return null;
  }

  if (activeProvider === "paddle") {
    // Summary rows may lack provider fields — prefer usable status, else newest.
    const usable = rows.find((row) => isSubscriptionUsable(row.status));
    if (usable) {
      return usable;
    }
    return rows[0] ?? null;
  }

  const usable = rows.find((row) => isSubscriptionUsable(row.status));
  if (usable) {
    return usable;
  }

  return rows[0] ?? null;
}
