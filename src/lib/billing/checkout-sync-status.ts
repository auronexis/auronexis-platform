import "server-only";

import { hasVerifiedMollieSubscription } from "@/lib/billing/active-billing";
import { getBillingOverview } from "@/lib/billing/queries";
import type { BillingProvider } from "@/lib/billing/provider-types";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import type { SessionContext } from "@/lib/tenancy/context";

export type CheckoutSyncStatus = {
  provider: BillingProvider;
  syncPending: boolean;
  isUsable: boolean;
  hasVerifiedSubscription: boolean;
  planLabel: string;
  statusLabel: string;
  paymentStatusLabel: string;
  billingPeriodLabel: string | null;
  /** True when webhook sync finished and a verified usable Mollie sub exists. */
  synchronized: boolean;
};

/** Read verified server-side sync state — never trusts browser checkout events. */
export async function getCheckoutSyncStatus(session: SessionContext): Promise<CheckoutSyncStatus> {
  const provider = getActiveBillingProvider();
  const overview = await getBillingOverview(session);
  const subscription = overview.subscription;

  const syncPending = Boolean(subscription?.sync_pending);
  const hasSubscription = hasVerifiedMollieSubscription(subscription);
  const isUsable = overview.isUsable;
  const synchronized = provider === "mollie" && !syncPending && isUsable && hasSubscription;

  return {
    provider,
    syncPending,
    isUsable,
    hasVerifiedSubscription: hasSubscription,
    planLabel: overview.planLabel,
    statusLabel: overview.statusLabel,
    paymentStatusLabel: overview.paymentStatusLabel,
    billingPeriodLabel: overview.billingPeriodLabel,
    synchronized,
  };
}
