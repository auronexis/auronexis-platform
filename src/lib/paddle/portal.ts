import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getPaddleClient } from "@/lib/paddle/client";

/**
 * Create a fresh Paddle customer portal session for a Paddle-backed organization.
 * Never stores reusable portal URLs.
 */
export async function createPaddlePortalSession(input: {
  organizationId: string;
}): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("billing_provider, provider_customer_id, provider_subscription_id")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load billing record: ${error.message}`);
  }

  const row = data as {
    billing_provider?: string;
    provider_customer_id?: string | null;
    provider_subscription_id?: string | null;
  } | null;

  if (!row || row.billing_provider !== "paddle" || !row.provider_customer_id) {
    throw new Error(
      "No verified Paddle customer is linked to this organization. Complete a Paddle checkout first.",
    );
  }

  const subscriptionIds = row.provider_subscription_id ? [row.provider_subscription_id] : [];
  const paddle = getPaddleClient();
  const session = await paddle.customerPortalSessions.create(
    row.provider_customer_id,
    subscriptionIds,
  );

  const portalUrl = session.urls?.general?.overview;
  if (!portalUrl) {
    throw new Error("Paddle did not return a customer portal URL.");
  }

  return portalUrl;
}
