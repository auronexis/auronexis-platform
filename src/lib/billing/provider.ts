import "server-only";

import {
  isBillingProvider,
  type BillingProvider,
} from "@/lib/billing/provider-types";

/**
 * Active checkout provider for new self-serve purchases.
 * Defaults to stripe so existing production behavior is preserved until
 * BILLING_PROVIDER=paddle is set deliberately.
 */
export function getActiveBillingProvider(): BillingProvider {
  const raw = process.env.BILLING_PROVIDER?.trim().toLowerCase();
  if (!raw) {
    return "stripe";
  }
  if (!isBillingProvider(raw)) {
    throw new Error(
      `Invalid BILLING_PROVIDER "${raw}". Expected "stripe" or "paddle".`,
    );
  }
  return raw;
}

export function isPaddleCheckoutEnabled(): boolean {
  return getActiveBillingProvider() === "paddle";
}

/** True when env BILLING_PROVIDER selects Paddle as the sole active billing provider. */
export function isPaddleActiveBillingProvider(): boolean {
  return getActiveBillingProvider() === "paddle";
}
