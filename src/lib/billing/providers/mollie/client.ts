import "server-only";

import { createMollieClient, type MollieClient } from "@mollie/api-client";

import { getMollieApiKey } from "@/lib/billing/providers/mollie/env";
import { assertMollieApiModeForPaymentOps } from "@/lib/billing/providers/mollie/mode";

/**
 * Server-only Mollie client factory.
 * Never expose the client or API key to Client Components.
 */
export function createMollieBillingClient(): MollieClient {
  const apiKey = getMollieApiKey();
  assertMollieApiModeForPaymentOps(apiKey);
  return createMollieClient({ apiKey });
}
