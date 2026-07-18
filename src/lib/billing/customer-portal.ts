import "server-only";

import { getActiveBillingProvider } from "@/lib/billing/provider";
import { createPaddlePortalSession } from "@/lib/paddle/portal";
import { getAppUrl } from "@/lib/env";
import { createPortalSession as createStripePortalSession } from "@/lib/stripe/subscriptions";

/**
 * Open the customer portal for the configured active billing provider.
 * When BILLING_PROVIDER=paddle, never falls back to Stripe portal.
 */
export async function openCustomerPortal(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  const provider = getActiveBillingProvider();

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
