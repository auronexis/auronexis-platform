import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import type { StripeBillingUiStatus } from "@/lib/billing/types";
import type { StripeEnvDiagnostics } from "@/lib/diagnostics/types";
import { getStripeEnvDiagnostics } from "@/lib/diagnostics/stripe-env";
import { isStripePortalCancellationEnabled } from "@/lib/stripe/portal-config";

const CHECKOUT_ENV_CHECKS = [
  "secretKey",
  "publishableKey",
  "starterPriceId",
  "professionalPriceId",
  "businessPriceId",
] as const satisfies readonly (keyof StripeEnvDiagnostics)[];

/** Log missing Stripe env vars server-side — never shown in customer UI. */
export function logStripeEnvGaps(context = "billing"): void {
  const env = getStripeEnvDiagnostics();
  const missing = CHECKOUT_ENV_CHECKS.filter((key) => !env[key].present).map((key) => env[key].name);

  if (missing.length > 0) {
    console.warn(`[stripe][${context}] Missing environment variables: ${missing.join(", ")}`);
  }
}

/** Resolve customer-safe billing capability flags for pricing and billing UI. */
export function getStripeBillingUiStatus(): StripeBillingUiStatus {
  logStripeEnvGaps("pricing");
  const env = getStripeEnvDiagnostics();
  const checkoutAvailable = env.secretKey.present && env.publishableKey.present;

  return {
    checkoutAvailable,
    portalAvailable: env.secretKey.present,
    portalCancellationAvailable: false,
    planCheckoutReady: {
      starter: checkoutAvailable && env.starterPriceId.present,
      professional: checkoutAvailable && env.professionalPriceId.present,
      business: checkoutAvailable && env.businessPriceId.present,
      enterprise: false,
    },
  };
}

/** Billing UI status including live Stripe Customer Portal feature flags. */
export async function getStripeBillingUiStatusWithPortalFeatures(): Promise<StripeBillingUiStatus> {
  const base = getStripeBillingUiStatus();
  const portalCancellationAvailable = base.portalAvailable
    ? await isStripePortalCancellationEnabled()
    : false;

  return {
    ...base,
    portalCancellationAvailable,
  };
}

export function assertPlanCheckoutReady(planKey: PlanKey): void {
  const status = getStripeBillingUiStatus();

  if (planKey === "enterprise") {
    throw new Error("Contact sales for Enterprise plans.");
  }

  if (!status.checkoutAvailable || !status.planCheckoutReady[planKey]) {
    logStripeEnvGaps("checkout");
    throw new Error("Checkout temporarily unavailable.");
  }
}
