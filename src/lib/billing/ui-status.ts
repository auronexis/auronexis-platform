import "server-only";

import type { StripeBillingUiStatus } from "@/lib/billing/types";
import { isPaddleConfigured } from "@/lib/paddle/env";

function paddlePlanReady(planKey: "professional" | "business"): boolean {
  const envKey =
    planKey === "professional"
      ? "PADDLE_PRICE_PROFESSIONAL_MONTHLY"
      : "PADDLE_PRICE_BUSINESS_MONTHLY";
  const value = process.env[envKey]?.trim();
  return Boolean(value?.startsWith("pri_"));
}

/**
 * Resolve customer-safe billing capability flags for pricing and billing UI.
 * Paddle-only: Stripe has been removed from active billing entirely.
 */
export function getBillingUiStatus(): StripeBillingUiStatus {
  const paddleReady = isPaddleConfigured();

  return {
    checkoutAvailable: paddleReady,
    portalAvailable: paddleReady,
    portalCancellationAvailable: false,
    planCheckoutReady: {
      starter: false,
      professional: paddleReady && paddlePlanReady("professional"),
      business: paddleReady && paddlePlanReady("business"),
      enterprise: false,
    },
  };
}

/**
 * Billing UI status including live portal feature flags.
 * Paddle has no equivalent live cancellation-toggle check today, so this is
 * currently identical to {@link getBillingUiStatus}; kept async for callers
 * that await it and for future portal feature checks.
 */
export async function getBillingUiStatusWithPortalFeatures(): Promise<StripeBillingUiStatus> {
  return getBillingUiStatus();
}
