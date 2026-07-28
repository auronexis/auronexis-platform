/**
 * Client-safe checkout success constants for the active billing provider.
 * Access is never granted from these strings or a browser callback —
 * only verified webhook/server sync activates entitlements.
 */

export const CHECKOUT_SUCCESS_PATH = "/settings/billing?checkout=success";

export const CHECKOUT_SUCCESS_MESSAGE =
  "Payment completed. Your subscription is being synchronized.";

export const CHECKOUT_SYNC_SLOW_MESSAGE =
  "Payment was received. Billing information may take a moment to update.";

/** Absolute success URL for FastSpring popup redirect (browser only). */
export function getCheckoutSuccessUrl(): string {
  if (typeof window === "undefined") {
    return CHECKOUT_SUCCESS_PATH;
  }
  return `${window.location.origin}${CHECKOUT_SUCCESS_PATH}`;
}

export function isCheckoutSuccessParam(checkout: string | null | undefined): boolean {
  return checkout === "success";
}
