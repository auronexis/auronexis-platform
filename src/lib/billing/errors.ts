import {
  FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/active-billing";
import {
  PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE,
  PLAN_CHANGE_CONFLICT_MESSAGE,
} from "@/lib/billing/plan-change";

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

  if (error.message === FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE) {
    return FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE;
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

  const planChangeMessage = resolvePlanChangeCustomerError(error);
  if (planChangeMessage) {
    return planChangeMessage;
  }

  return fallback;
}

/** Map Mollie plan-change domain errors to customer-safe copy. */
export function resolvePlanChangeCustomerError(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message.includes("already scheduled") && error.message.includes("this target")) {
    return PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE;
  }

  if (error.message.includes("already scheduled")) {
    return PLAN_CHANGE_CONFLICT_MESSAGE;
  }

  if (error.message === "This is your organization's current plan.") {
    return error.message;
  }

  if (error.message === "No active Mollie subscription to change.") {
    return "No active subscription to change. Complete checkout first or contact support.";
  }

  if (error.message.includes("Mollie customer mapping missing")) {
    return "Billing profile is incomplete. Contact support to fix your subscription mapping.";
  }

  if (error.message === "Enterprise plan changes are manual-only.") {
    return "Enterprise plan changes are manual-only. Contact sales.";
  }

  return null;
}

/** Expected duplicate/conflict plan-change guard — not a fatal checkout failure. */
export function isExpectedPlanChangeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("already scheduled") ||
      error.message === "This is your organization's current plan.")
  );
}

/** Expected pre-purchase portal absence — must not be logged as an error. */
export function isExpectedPortalUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message === FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE;
}
