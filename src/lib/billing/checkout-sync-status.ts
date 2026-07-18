import "server-only";

import {
  hasVerifiedPaddleCustomer,
  hasVerifiedPaddleSubscription,
} from "@/lib/billing/active-billing";
import { getBillingOverview } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import type { SessionContext } from "@/lib/tenancy/context";

export type PaddleCheckoutSyncStatus = {
  provider: "paddle" | "stripe";
  syncPending: boolean;
  isUsable: boolean;
  hasVerifiedPaddleCustomer: boolean;
  hasVerifiedPaddleSubscription: boolean;
  planLabel: string;
  statusLabel: string;
  paymentStatusLabel: string;
  billingPeriodLabel: string | null;
  /** True when webhook sync finished and a verified active/trialing Paddle sub exists. */
  synchronized: boolean;
};

/** Read verified server-side sync state — never trusts Paddle.js client events. */
export async function getPaddleCheckoutSyncStatus(
  session: SessionContext,
): Promise<PaddleCheckoutSyncStatus> {
  const provider = getActiveBillingProvider();
  const overview = await getBillingOverview(session);
  const subscription = overview.subscription;

  const syncPending = Boolean(subscription?.sync_pending);
  const hasCustomer = hasVerifiedPaddleCustomer(subscription);
  const hasSubscription = hasVerifiedPaddleSubscription(subscription);
  const isUsable = overview.isUsable;
  const synchronized =
    provider === "paddle" &&
    !syncPending &&
    isUsable &&
    hasSubscription;

  return {
    provider,
    syncPending,
    isUsable,
    hasVerifiedPaddleCustomer: hasCustomer,
    hasVerifiedPaddleSubscription: hasSubscription,
    planLabel: overview.planLabel,
    statusLabel: overview.statusLabel,
    paymentStatusLabel: overview.paymentStatusLabel,
    billingPeriodLabel: overview.billingPeriodLabel,
    synchronized,
  };
}
