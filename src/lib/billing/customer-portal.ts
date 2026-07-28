import "server-only";

import { FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";

/**
 * FastSpring does not expose a hosted customer portal in this integration.
 * Subscription changes are handled via FastSpring purchase emails or support.
 * Always fails closed with a customer-safe message — never falls back to Paddle.
 */
export async function openCustomerPortal(_input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  throw new Error(FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE);
}
