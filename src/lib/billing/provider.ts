import "server-only";

import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Active checkout provider for new self-serve purchases.
 *
 * Mollie is the sole active billing provider. FastSpring, Paddle, and Stripe
 * subscription rows may remain in the database as historical records — they
 * must never drive new checkout, portal access, or provider selection defaults.
 */
export function getActiveBillingProvider(): BillingProvider {
  return "mollie";
}

/** @deprecated FastSpring is retired — always false. Prefer getActiveBillingProvider(). */
export function isFastSpringActiveBillingProvider(): boolean {
  return false;
}

export function isMollieActiveBillingProvider(): boolean {
  return getActiveBillingProvider() === "mollie";
}
