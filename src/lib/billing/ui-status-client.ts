import type { BillingUiStatus } from "@/lib/billing/types";

/**
 * Client-safe billing UI status helpers — no server-only imports, so this
 * can be used from "use client" components (pricing grid/card) as well as
 * server components/pages.
 */
export const FALLBACK_BILLING_UI_STATUS: BillingUiStatus = {
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

/** Normalize a possibly-missing/partial billing UI status into a safe, fully-populated object. */
export function normalizeBillingUiStatus(
  status: BillingUiStatus | null | undefined,
): BillingUiStatus {
  if (!status) {
    return FALLBACK_BILLING_UI_STATUS;
  }

  return {
    checkoutAvailable: Boolean(status.checkoutAvailable),
    portalAvailable: Boolean(status.portalAvailable),
    portalCancellationAvailable: Boolean(status.portalCancellationAvailable),
    planCheckoutReady: {
      starter: Boolean(status.planCheckoutReady?.starter),
      professional: Boolean(status.planCheckoutReady?.professional),
      business: Boolean(status.planCheckoutReady?.business),
      enterprise: Boolean(status.planCheckoutReady?.enterprise),
    },
  };
}
