import "server-only";

import type { StripeBillingUiStatus } from "@/lib/billing/types";
import { isFastSpringApiConfigured, isFastSpringWebhookConfigured } from "@/lib/fastspring/env";
import { isFastSpringCheckoutConfigured } from "@/lib/fastspring/checkout";
import { isMollieProductionCheckoutConfigured } from "@/lib/billing/providers/mollie/production-checkout";
import { isMollieProductionCheckoutEligible } from "@/lib/billing/providers/mollie/rollout";
import type { BillingProvider } from "@/lib/billing/provider-types";

/**
 * Resolve customer-safe billing capability flags for pricing and billing UI.
 * FastSpring is the global default. Mollie flags apply only for Mollie-resolved orgs.
 */
export function getBillingUiStatus(input?: {
  organizationId?: string;
  organizationProvider?: BillingProvider;
}): StripeBillingUiStatus {
  const orgProvider = input?.organizationProvider ?? "fastspring";
  const orgId = input?.organizationId;

  if (orgProvider === "mollie" && orgId && isMollieProductionCheckoutEligible(orgId)) {
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
export async function getBillingUiStatusWithPortalFeatures(input?: {
  organizationId?: string;
  organizationProvider?: BillingProvider;
}): Promise<StripeBillingUiStatus> {
  return getBillingUiStatus(input);
}
