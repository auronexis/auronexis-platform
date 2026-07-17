import "server-only";

import { getAppUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPaddlePortalSession } from "@/lib/paddle/portal";
import { createPortalSession as createStripePortalSession } from "@/lib/stripe/subscriptions";

/**
 * Open the customer portal for the organization's verified billing provider.
 * Stripe-backed orgs keep Stripe portal; Paddle-backed orgs use Paddle portal.
 */
export async function openCustomerPortal(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_subscriptions")
    .select("billing_provider")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  const provider = (data as { billing_provider?: string } | null)?.billing_provider ?? "stripe";

  if (provider === "paddle") {
    return createPaddlePortalSession({ organizationId: input.organizationId });
  }

  const appUrl = getAppUrl();
  return createStripePortalSession({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    email: input.email,
    returnUrl: input.returnUrl ?? `${appUrl}/settings/billing`,
  });
}

export { createPortalSession } from "@/lib/stripe/subscriptions";
