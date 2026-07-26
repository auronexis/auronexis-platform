import "server-only";

import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Active checkout provider for new self-serve purchases.
 *
 * FastSpring is the active provider for NEW checkouts after the production
 * cutover. Usable legacy Paddle subscription rows continue to grant
 * entitlements via provider-aware selection — they are never auto-migrated.
 *
 * Stripe remains archive-only and must never be returned here.
 */
export function getActiveBillingProvider(): BillingProvider {
  return "fastspring";
}

/** True when new self-serve checkouts should use Paddle (disabled after FastSpring cutover). */
export function isPaddleCheckoutEnabled(): boolean {
  return getActiveBillingProvider() === "paddle";
}

/** @deprecated Prefer getActiveBillingProvider() === "paddle". */
export function isPaddleActiveBillingProvider(): boolean {
  return getActiveBillingProvider() === "paddle";
}

export function isFastSpringActiveBillingProvider(): boolean {
  return getActiveBillingProvider() === "fastspring";
}
