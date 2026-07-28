import "server-only";

import type { StripeBillingUiStatus } from "@/lib/billing/types";
import { isFastSpringApiConfigured, isFastSpringWebhookConfigured } from "@/lib/fastspring/env";
import { isFastSpringCheckoutConfigured } from "@/lib/fastspring/checkout";

/**
 * Resolve customer-safe billing capability flags for pricing and billing UI.
 * FastSpring is the sole active billing provider — no hosted customer
 * portal is available in this integration.
 */
export function getBillingUiStatus(): StripeBillingUiStatus {
  const fastspringReady =
    isFastSpringApiConfigured() && isFastSpringWebhookConfigured() && isFastSpringCheckoutConfigured();

  return {
    checkoutAvailable: fastspringReady,
    portalAvailable: false,
    portalCancellationAvailable: false,
    planCheckoutReady: {
      starter: false,
      professional: fastspringReady,
      business: fastspringReady,
      enterprise: fastspringReady,
    },
  };
}

/**
 * Billing UI status including live portal feature flags.
 */
export async function getBillingUiStatusWithPortalFeatures(): Promise<StripeBillingUiStatus> {
  return getBillingUiStatus();
}
