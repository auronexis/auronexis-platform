import type { PlanKey } from "@/lib/billing/plans";
import type { StripeBillingUiStatus } from "@/lib/billing/types";

const DEFAULT_PLAN_CHECKOUT_READY: Record<PlanKey, boolean> = {
  starter: false,
  professional: false,
  business: false,
  enterprise: false,
};

export const FALLBACK_STRIPE_BILLING_UI_STATUS: StripeBillingUiStatus = {
  checkoutAvailable: false,
  portalAvailable: false,
  portalCancellationAvailable: false,
  planCheckoutReady: DEFAULT_PLAN_CHECKOUT_READY,
};

/** Normalize Stripe UI flags for client props — never throws. */
export function normalizeStripeBillingUiStatus(
  status: StripeBillingUiStatus | null | undefined,
): StripeBillingUiStatus {
  if (!status) {
    return FALLBACK_STRIPE_BILLING_UI_STATUS;
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
