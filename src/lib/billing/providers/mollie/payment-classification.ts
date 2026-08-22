import "server-only";

import { isMollieBackedSubscription } from "@/lib/billing/active-billing";
import { isSubscriptionPaidThroughPeriodEnd } from "@/lib/billing/subscription-management";
import {
  isMollieSubscriptionEntitlementGranting,
  mapMollieSubscriptionStatus,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import {
  MOLLIE_BILLING_PURPOSE_INITIAL_PURCHASE,
  MOLLIE_BILLING_PURPOSE_RENEWAL,
  MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT,
} from "@/lib/billing/providers/mollie/upgrade-payment";
import type { OrganizationSubscription } from "@/types/database";

export type MollieProductionPaymentKind =
  | "initial_purchase"
  | "renewal"
  | "upgrade_adjustment";

export function classifyMollieProductionPayment(input: {
  sequenceType: string | null | undefined;
  billingPurpose: string | null;
}): MollieProductionPaymentKind {
  if (input.billingPurpose === MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT) {
    return "upgrade_adjustment";
  }

  if (
    input.sequenceType === "first" ||
    input.billingPurpose === MOLLIE_BILLING_PURPOSE_INITIAL_PURCHASE
  ) {
    return "initial_purchase";
  }

  if (input.billingPurpose === MOLLIE_BILLING_PURPOSE_RENEWAL) {
    return "renewal";
  }

  return "renewal";
}

/**
 * Terminal org subscription rows must not steer fresh-purchase webhook routing.
 * Paid-through cancel_at_period_end windows remain authoritative for renewals.
 */
export function isStaleMollieOrganizationSubscription(
  row: OrganizationSubscription | null | undefined,
): boolean {
  if (!row || !isMollieBackedSubscription(row)) {
    return false;
  }

  if (!row.provider_subscription_id?.startsWith("sub_")) {
    return false;
  }

  if (
    isSubscriptionPaidThroughPeriodEnd({
      cancelAtPeriodEnd: row.cancel_at_period_end,
      currentPeriodEnd: row.current_period_end,
    })
  ) {
    return false;
  }

  const mapped = mapMollieSubscriptionStatus(row.provider_status ?? row.status);
  return mapped === "canceled" || mapped === "inactive" || mapped === "past_due";
}

export function isReusableMollieProviderSubscriptionStatus(
  providerStatus: string | null | undefined,
): boolean {
  return isMollieSubscriptionEntitlementGranting(providerStatus);
}

export function resolveMolliePaidTransactionProductName(input: {
  paymentKind: MollieProductionPaymentKind;
  planName: string;
}): string {
  switch (input.paymentKind) {
    case "initial_purchase":
      return `${input.planName} subscription`;
    case "upgrade_adjustment":
      return `Upgrade adjustment — ${input.planName}`;
    case "renewal":
    default:
      return `${input.planName} renewal`;
  }
}

export function shouldRouteMolliePaymentAsInitialPurchase(input: {
  sequenceType: string | null | undefined;
  billingPurpose: string | null;
  orgRow: OrganizationSubscription | null;
}): boolean {
  const kind = classifyMollieProductionPayment({
    sequenceType: input.sequenceType,
    billingPurpose: input.billingPurpose,
  });

  if (kind !== "initial_purchase") {
    return false;
  }

  if (isStaleMollieOrganizationSubscription(input.orgRow)) {
    return true;
  }

  return input.sequenceType === "first";
}
