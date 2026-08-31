import "server-only";

import { getOrganizationSubscription } from "@/lib/billing/queries";
import { getPaymentSummaryLabel } from "@/lib/billing/status";
import { resolveSubscriptionManagementState } from "@/lib/billing/subscription-management";
import { safeGetPlanByKey } from "@/lib/billing/plans";
import { safeGetPlanKeyFromSubscriptionPrice } from "@/lib/billing/plans.server";
import type { SessionContext } from "@/lib/tenancy/context";

export type BillingProviderNextPayment = {
  date: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
};

export type BillingProviderPaymentMethodSummary = {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

export type BillingProviderDetails = {
  planLabel: string;
  status: string;
  paymentStatus: string;
  periodStart: string | null;
  periodEnd: string | null;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  /** No live billing-provider API is queried here — always null (webhook sync only). */
  nextPayment: BillingProviderNextPayment | null;
  /** No live billing-provider API is queried here — always null (webhook sync only). */
  paymentMethod: BillingProviderPaymentMethodSummary | null;
};

/**
 * Customer-facing billing summary for the current organization, derived
 * entirely from the locally persisted subscription row. Never calls a
 * provider API — FastSpring state is reconciled by verified webhook sync,
 * not live lookups.
 */
export async function getBillingProviderDetails(
  session: SessionContext,
): Promise<BillingProviderDetails> {
  const subscription = await getOrganizationSubscription(session);

  const planKey = safeGetPlanKeyFromSubscriptionPrice({
    billingProvider: subscription?.billing_provider,
    providerPriceId: subscription?.provider_price_id,
  });
  const plan = planKey ? safeGetPlanByKey(planKey) : null;
  const rawStatus = subscription?.provider_status ?? subscription?.status ?? null;
  const management = resolveSubscriptionManagementState(subscription, rawStatus);

  return {
    planLabel: management.statusLabel === "No active subscription"
      ? "Free"
      : (plan?.name ?? "Subscription"),
    status: management.statusLabel,
    paymentStatus: getPaymentSummaryLabel(rawStatus),
    periodStart: subscription?.current_period_start ?? null,
    periodEnd: subscription?.current_period_end ?? null,
    renewalDate: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    nextPayment: null,
    paymentMethod: null,
  };
}
