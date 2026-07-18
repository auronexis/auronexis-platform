import "server-only";

import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Active checkout provider for new self-serve purchases.
 *
 * Stripe has been removed from active billing — Paddle is the sole active
 * provider. Any Stripe code, rows, or env vars that still exist are a
 * historical archive only and must never be selected here. This always
 * returns "paddle" regardless of the BILLING_PROVIDER env value.
 */
export function getActiveBillingProvider(): BillingProvider {
  return "paddle";
}

/** Paddle checkout is unconditionally enabled — there is no other active provider. */
export function isPaddleCheckoutEnabled(): boolean {
  return true;
}

/** Paddle is unconditionally the sole active billing provider. */
export function isPaddleActiveBillingProvider(): boolean {
  return true;
}
