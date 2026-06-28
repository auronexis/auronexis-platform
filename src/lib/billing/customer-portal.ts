import "server-only";

import { createPortalSession as createStripePortalSession } from "@/lib/stripe/subscriptions";

export async function openCustomerPortal(input: {
  organizationId: string;
  returnUrl?: string;
}): Promise<string> {
  return createStripePortalSession({
    organizationId: input.organizationId,
    returnUrl: input.returnUrl,
  });
}

export { createPortalSession } from "@/lib/stripe/subscriptions";
