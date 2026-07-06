import "server-only";

import { getAppUrl } from "@/lib/env";
import { createPortalSession as createStripePortalSession } from "@/lib/stripe/subscriptions";

export async function openCustomerPortal(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  const appUrl = getAppUrl();

  return createStripePortalSession({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    email: input.email,
    returnUrl: input.returnUrl ?? `${appUrl}/settings/billing`,
  });
}

export { createPortalSession } from "@/lib/stripe/subscriptions";
