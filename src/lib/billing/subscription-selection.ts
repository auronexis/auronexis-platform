import {
  hasVerifiedFastSpringSubscription,
  hasVerifiedMollieSubscription,
  hasVerifiedPaddleSubscription,
  isActiveBillingSubscriptionRow,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
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
 * Pick the best subscription row for the resolved org billing provider.
 * FastSpring remains the global default. Mollie rows are selected only when
 * activeProvider === "mollie". Legacy Paddle rows never grant access.
 */
export function selectPreferredSubscriptionRow(
  rows: OrganizationSubscription[],
  activeProvider: BillingProvider = "fastspring",
): OrganizationSubscription | null {
  if (rows.length === 0) {
    return null;
  }

  const candidates = rows
    .filter((row) => isActiveBillingSubscriptionRow(row, activeProvider))
    .sort(sortByUpdatedAtDesc);

  if (activeProvider === "fastspring") {
    const usableFastSpring = candidates.find(
      (row) =>
        isFastSpringBackedSubscription(row) &&
        isSubscriptionUsable(row.provider_status ?? row.status),
    );
    if (usableFastSpring) {
      return usableFastSpring;
    }

    const withFastSpringSub = candidates.find((row) => hasVerifiedFastSpringSubscription(row));
    if (withFastSpringSub) {
      return withFastSpringSub;
    }

    return candidates.find((row) => isFastSpringBackedSubscription(row)) ?? null;
  }

  if (activeProvider === "mollie") {
    const usableMollie = candidates.find(
      (row) =>
        isMollieBackedSubscription(row) &&
        isSubscriptionUsable(row.provider_status ?? row.status),
    );
    if (usableMollie) {
      return usableMollie;
    }

    const withMollieSub = candidates.find((row) => hasVerifiedMollieSubscription(row));
    if (withMollieSub) {
      return withMollieSub;
    }

    return candidates.find((row) => isMollieBackedSubscription(row)) ?? null;
  }

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
  T extends {
    status: string | null;
    updated_at?: string;
    billing_provider?: string | null;
    provider_subscription_id?: string | null;
  },
>(rows: T[], activeProvider: BillingProvider = "fastspring"): T | null {
  if (rows.length === 0) {
    return null;
  }

  if (activeProvider === "fastspring") {
    const fastspringRows = rows.filter((row) => row.billing_provider === "fastspring");

    const usableFs = fastspringRows.find((row) => isSubscriptionUsable(row.status));
    if (usableFs) return usableFs;

    const withFsSub = fastspringRows.find((row) => Boolean(row.provider_subscription_id?.trim()));
    if (withFsSub) return withFsSub;

    return fastspringRows[0] ?? null;
  }

  if (activeProvider === "mollie") {
    const mollieRows = rows.filter((row) => row.billing_provider === "mollie");

    const usable = mollieRows.find((row) => isSubscriptionUsable(row.status));
    if (usable) return usable;

    const withSub = mollieRows.find((row) =>
      Boolean(row.provider_subscription_id?.startsWith("sub_")),
    );
    if (withSub) return withSub;

    return mollieRows[0] ?? null;
  }

  if (activeProvider === "paddle") {
    const paddleRows = rows.filter((row) => row.billing_provider === "paddle");
    const candidates = paddleRows.length > 0 ? paddleRows : [];
    const usable = candidates.find((row) => isSubscriptionUsable(row.status));
    if (usable) {
      return usable;
    }
    const withSub = candidates.find((row) =>
      Boolean(row.provider_subscription_id?.startsWith("sub_")),
    );
    if (withSub) {
      return withSub;
    }
    return candidates[0] ?? null;
  }

  const usable = rows.find((row) => isSubscriptionUsable(row.status));
  if (usable) {
    return usable;
  }

  return rows[0] ?? null;
}
