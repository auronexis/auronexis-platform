const INTERNAL_BILLING_PATTERNS = [
  /STRIPE_/i,
  /environment variable/i,
  /Missing Stripe price ID/i,
  /Set STRIPE_/i,
  /NEXT_PUBLIC_STRIPE/i,
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

  if (error.message === "Unable to load billing profile.") {
    return "Unable to load billing information. Try again later.";
  }

  if (/invalid promo|promotion unavailable|unable to apply/i.test(error.message)) {
    return error.message;
  }

  return fallback;
}
