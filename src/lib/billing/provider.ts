import "server-only";

import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Active checkout provider for new self-serve purchases.
 *
 * FastSpring is the sole active provider after the production Paddle
 * cutover. Usable legacy Paddle subscription rows are historical only —
 * they no longer grant entitlements, checkout, or portal access.
 *
 * Stripe remains archive-only and must never be returned here.
 */
export function getActiveBillingProvider(): BillingProvider {
  return "fastspring";
}

export function isFastSpringActiveBillingProvider(): boolean {
  return getActiveBillingProvider() === "fastspring";
}
