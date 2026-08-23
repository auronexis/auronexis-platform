import "server-only";

import type { StripeBillingUiStatus } from "@/lib/billing/types";
import { isMollieProductionCheckoutConfigured } from "@/lib/billing/providers/mollie/production-checkout";
import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Resolve customer-safe billing capability flags for pricing and billing UI.
 * Mollie is the sole active provider. Historical FastSpring-owned orgs get
 * checkout disabled (self-serve plan changes via support only).
 */
export function getBillingUiStatus(input?: {
  organizationId?: string;
  organizationProvider?: BillingProvider;
}): StripeBillingUiStatus {
  const orgProvider = input?.organizationProvider ?? "mollie";

  if (orgProvider === "fastspring") {
    return {
      checkoutAvailable: false,
      portalAvailable: false,
      portalCancellationAvailable: false,
      planCheckoutReady: {
        starter: false,
        professional: false,
        business: false,
        enterprise: false,
      },
    };
  }

  const mollieReady = isMollieProductionCheckoutConfigured();
  return {
    checkoutAvailable: mollieReady,
    portalAvailable: false,
    portalCancellationAvailable: false,
    planCheckoutReady: {
      starter: false,
      professional: mollieReady,
      business: mollieReady,
      enterprise: false,
    },
  };
}

/**
 * Billing UI status including live portal feature flags.
 */
export async function getBillingUiStatusWithPortalFeatures(input?: {
  organizationId?: string;
  organizationProvider?: BillingProvider;
}): Promise<StripeBillingUiStatus> {
  return getBillingUiStatus(input);
}
