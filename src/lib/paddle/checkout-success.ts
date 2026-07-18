/**
 * Client-safe Paddle checkout success constants.
 * Access is never granted from these strings or the browser callback —
 * only verified webhook/server sync activates entitlements.
 */

export const PADDLE_CHECKOUT_SUCCESS_PATH = "/settings/billing?checkout=success";

export const PADDLE_CHECKOUT_SUCCESS_MESSAGE =
  "Payment completed. Your subscription is being synchronized.";

export const PADDLE_CHECKOUT_SYNC_SLOW_MESSAGE =
  "Payment was received. Billing information may take a moment to update.";

/** Absolute success URL for Paddle overlay redirect (browser only). */
export function getPaddleCheckoutSuccessUrl(): string {
  if (typeof window === "undefined") {
    return PADDLE_CHECKOUT_SUCCESS_PATH;
  }
  return `${window.location.origin}${PADDLE_CHECKOUT_SUCCESS_PATH}`;
}

export function isPaddleCheckoutSuccessParam(checkout: string | null | undefined): boolean {
  return checkout === "success";
}
