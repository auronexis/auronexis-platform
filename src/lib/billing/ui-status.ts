import "server-only";

import type { StripeBillingUiStatus } from "@/lib/billing/types";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { isFastSpringApiConfigured, isFastSpringWebhookConfigured } from "@/lib/fastspring/env";
import { isFastSpringCheckoutConfigured } from "@/lib/fastspring/checkout";
import { isPaddleConfigured } from "@/lib/paddle/env";

/**
 * Resolve customer-safe billing capability flags for pricing and billing UI.
 * Active provider is FastSpring; Paddle flags remain for legacy portal eligibility only.
 */
export function getBillingUiStatus(): StripeBillingUiStatus {
  const activeProvider = getActiveBillingProvider();

  if (activeProvider === "fastspring") {
    const fastspringReady =
      isFastSpringApiConfigured() &&
      isFastSpringWebhookConfigured() &&
      isFastSpringCheckoutConfigured();

    return {
      checkoutAvailable: fastspringReady,
      // Portal is only for legacy Paddle customers; UI gates separately.
      portalAvailable: isPaddleConfigured(),
      portalCancellationAvailable: false,
      planCheckoutReady: {
        starter: false,
        professional: fastspringReady,
        business: fastspringReady,
        enterprise: fastspringReady,
      },
    };
  }

  const paddleReady = isPaddleConfigured();
  return {
    checkoutAvailable: paddleReady,
    portalAvailable: paddleReady,
    portalCancellationAvailable: false,
    planCheckoutReady: {
      starter: false,
      professional: paddleReady,
      business: paddleReady,
      enterprise: false,
    },
  };
}

/**
 * Billing UI status including live portal feature flags.
 */
export async function getBillingUiStatusWithPortalFeatures(): Promise<StripeBillingUiStatus> {
  return getBillingUiStatus();
}
