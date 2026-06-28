import type Stripe from "stripe";

export type SubscriptionStatus =
  | "inactive"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export type OrganizationSubscriptionRecord = {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StripeSubscriptionSyncInput = {
  organizationId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: Date | null;
};

export type StripeWebhookContext = {
  event: Stripe.Event;
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  inactive: "No subscription",
  incomplete: "Incomplete",
  incomplete_expired: "Expired",
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  canceled: "Cancelled",
  unpaid: "Unpaid",
  paused: "Paused",
};

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
]);

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return Boolean(status && ACTIVE_SUBSCRIPTION_STATUSES.has(status));
}

export function mapStripeSubscription(
  organizationId: string,
  subscription: Stripe.Subscription,
): StripeSubscriptionSyncInput {
  const primaryItem = subscription.items.data[0];
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  return {
    organizationId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: primaryItem?.price.id ?? null,
    status: subscription.status,
    currentPeriodStart: primaryItem?.current_period_start
      ? new Date(primaryItem.current_period_start * 1000)
      : null,
    currentPeriodEnd: primaryItem?.current_period_end
      ? new Date(primaryItem.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };
}

export function resolveOrganizationIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const organizationId = metadata?.organization_id;

  if (!organizationId || organizationId.trim().length === 0) {
    return null;
  }

  return organizationId;
}
