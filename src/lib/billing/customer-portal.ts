import "server-only";

import { createPaddlePortalSession } from "@/lib/paddle/portal";

/**
 * Open the Paddle customer portal — the sole active billing provider.
 * Never falls back to a Stripe portal, regardless of legacy Stripe data on
 * the org. Stripe removed from active billing; historical archive only.
 */
export async function openCustomerPortal(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  return createPaddlePortalSession({ organizationId: input.organizationId });
}
