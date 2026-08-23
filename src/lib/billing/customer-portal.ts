import "server-only";

import { BILLING_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";

/**
 * Mollie does not expose a hosted customer portal in this integration.
 * Subscription changes are handled in-app (cancel / keep / plan change) or via support.
 * Always fails closed with a customer-safe message.
 */
export async function openCustomerPortal(_input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  throw new Error(BILLING_PORTAL_UNAVAILABLE_MESSAGE);
}
