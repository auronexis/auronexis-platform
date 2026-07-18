import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPaddleClient } from "@/lib/paddle/client";
import {
  hasVerifiedPaddleCustomer,
  isPaddleBackedSubscription,
  PADDLE_PORTAL_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/active-billing";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import type { OrganizationSubscription } from "@/types/database";

/**
 * Create a fresh Paddle customer portal session for a Paddle-backed organization.
 * Never stores reusable portal URLs. Never falls back to Stripe.
 */
export async function createPaddlePortalSession(input: {
  organizationId: string;
}): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select(
      "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at",
    )
    .eq("organization_id", input.organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load billing record: ${error.message}`);
  }

  const row = selectPreferredSubscriptionRow(
    (data ?? []) as OrganizationSubscription[],
    "paddle",
  );

  if (!row || !isPaddleBackedSubscription(row) || !hasVerifiedPaddleCustomer(row)) {
    throw new Error(PADDLE_PORTAL_UNAVAILABLE_MESSAGE);
  }

  const subscriptionIds = row.provider_subscription_id ? [row.provider_subscription_id] : [];
  const paddle = getPaddleClient();
  const session = await paddle.customerPortalSessions.create(
    row.provider_customer_id!,
    subscriptionIds,
  );

  const portalUrl = session.urls?.general?.overview;
  if (!portalUrl) {
    throw new Error("Paddle did not return a customer portal URL.");
  }

  return portalUrl;
}
