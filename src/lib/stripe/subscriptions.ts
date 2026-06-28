import { getAppUrl } from "@/lib/env";
import type { PlanKey } from "@/lib/billing/plans";
import { getPlanPriceId } from "@/lib/billing/plans.server";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customers";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StripeSubscriptionSyncInput } from "@/lib/stripe/types";
import { mapStripeSubscription } from "@/lib/stripe/types";

type CreateCheckoutSessionInput = {
  organizationId: string;
  organizationName: string;
  email: string;
  planKey: PlanKey;
};

type CreatePortalSessionInput = {
  organizationId: string;
  returnUrl?: string;
};

/** Upsert local subscription state from Stripe — service role only. */
export async function upsertOrganizationSubscription(
  input: StripeSubscriptionSyncInput,
): Promise<void> {
  const admin = createAdminClient();

  const payload = {
    organization_id: input.organizationId,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_price_id: input.stripePriceId,
    status: input.status,
    current_period_start: input.currentPeriodStart?.toISOString() ?? null,
    current_period_end: input.currentPeriodEnd?.toISOString() ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    trial_ends_at: input.trialEndsAt?.toISOString() ?? null,
  };

  const { error } = await admin
    .from("organization_subscriptions")
    .upsert(payload as never, { onConflict: "organization_id" });

  if (error) {
    throw new Error(`Unable to sync subscription: ${error.message}`);
  }
}

/** Mark subscription inactive when Stripe deletes it. */
export async function markOrganizationSubscriptionCancelled(
  organizationId: string,
): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("organization_subscriptions")
    .update({
      status: "canceled",
      stripe_subscription_id: null,
      stripe_price_id: null,
      cancel_at_period_end: false,
      current_period_start: null,
      current_period_end: null,
      trial_ends_at: null,
    } as never)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Unable to cancel subscription record: ${error.message}`);
  }
}

/** Create a Stripe Checkout session for a new subscription. */
export async function createCheckoutSession(input: CreateCheckoutSessionInput): Promise<string> {
  const stripe = getStripeClient();
  const customerId = await getOrCreateStripeCustomer(input);
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: getPlanPriceId(input.planKey),
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url: `${appUrl}/settings/billing?cancelled=1`,
    allow_promotion_codes: true,
    metadata: {
      organization_id: input.organizationId,
      plan_key: input.planKey,
    },
    subscription_data: {
      metadata: {
        organization_id: input.organizationId,
        plan_key: input.planKey,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session did not return a URL.");
  }

  return session.url;
}

/** Create a Stripe Customer Portal session. */
export async function createPortalSession(input: CreatePortalSessionInput): Promise<string> {
  const admin = createAdminClient();
  const stripe = getStripeClient();
  const appUrl = getAppUrl();

  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("stripe_customer_id")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load billing profile.");
  }

  const stripeCustomerId = (data as { stripe_customer_id: string | null } | null)?.stripe_customer_id;

  if (!stripeCustomerId) {
    throw new Error("No Stripe customer found for this organization.");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: input.returnUrl ?? `${appUrl}/settings/billing`,
  });

  return session.url;
}

/** Sync subscription from Stripe subscription id. */
export async function syncSubscriptionById(
  organizationId: string,
  subscriptionId: string,
): Promise<void> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await upsertOrganizationSubscription(mapStripeSubscription(organizationId, subscription));
}

/** Update organization plan cache from subscription status. */
export async function syncOrganizationPlan(
  organizationId: string,
  status: string,
): Promise<void> {
  const admin = createAdminClient();
  const nextPlan =
    status === "active" || status === "trialing" || status === "past_due" ? "paid" : "free";

  const { error } = await admin
    .from("organizations")
    .update({ plan: nextPlan } as never)
    .eq("id", organizationId);

  if (error) {
    console.error("[stripe] organization plan sync failed:", error.message);
  }
}
