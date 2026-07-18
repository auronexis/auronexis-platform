import {
  PADDLE_PORTAL_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/active-billing";

const INTERNAL_BILLING_PATTERNS = [
  /STRIPE_/i,
  /PADDLE_/i,
  /environment variable/i,
  /Missing Stripe price ID/i,
  /Missing Paddle price/i,
  /Set STRIPE_/i,
  /NEXT_PUBLIC_STRIPE/i,
  /NEXT_PUBLIC_PADDLE/i,
  /discount code/i,
  /coupon invalid/i,
  /postgres/i,
  /PGRST/i,
  /supabase/i,
];

/** Map server billing errors to customer-safe messages. */
export function sanitizeBillingCustomerError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (INTERNAL_BILLING_PATTERNS.some((pattern) => pattern.test(error.message))) {
    return fallback;
  }

  if (error.message === "Contact sales for Enterprise plans.") {
    return "Contact sales for Enterprise plans.";
  }

  if (error.message === "Billing is currently unavailable.") {
    return error.message;
  }

  if (error.message === "No Stripe customer found for this organization.") {
    return "Manage billing will be available after you complete checkout.";
  }

  if (error.message === PADDLE_PORTAL_UNAVAILABLE_MESSAGE) {
    return PADDLE_PORTAL_UNAVAILABLE_MESSAGE;
  }

  if (error.message === "Unable to load billing profile.") {
    return "Unable to load billing information. Try again later.";
  }

  if (
    error.message === "Invoice not found." ||
    error.message === "An invoice PDF is not available for this transaction." ||
    error.message === "Unable to retrieve the invoice PDF right now. Try again later."
  ) {
    return error.message;
  }

  if (/invalid promo|promotion unavailable|unable to apply/i.test(error.message)) {
    return error.message;
  }

  if (
    error.message.includes("pending payment") ||
    error.message.includes("billing portal to downgrade") ||
    error.message.includes("current plan")
  ) {
    return error.message;
  }

  return fallback;
}

/** Expected pre-purchase portal absence — must not be logged as an error. */
export function isExpectedPortalUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message === PADDLE_PORTAL_UNAVAILABLE_MESSAGE;
}
