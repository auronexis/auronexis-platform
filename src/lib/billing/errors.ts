import {
  BILLING_PORTAL_UNAVAILABLE_MESSAGE,
  FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE,
} from "@/lib/billing/active-billing";
import {
  PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE,
  PLAN_CHANGE_CONFLICT_MESSAGE,
  UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE,
  UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE,
  UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE,
} from "@/lib/billing/plan-change";
import {
  PLAN_CHANGE_CANCEL_ALREADY_MESSAGE,
  SUBSCRIPTION_CANCEL_ALREADY_MESSAGE,
  SUBSCRIPTION_NOT_CANCELABLE_MESSAGE,
} from "@/lib/billing/subscription-management";

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

  if (
    error.message === BILLING_PORTAL_UNAVAILABLE_MESSAGE ||
    error.message === FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE
  ) {
    return BILLING_PORTAL_UNAVAILABLE_MESSAGE;
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

  if (
    /Mollie checkout is not configured|Mollie LIVE charging is disabled|not enabled for Mollie|sync is already in progress|FastSpring subscription|billed via Mollie/i.test(
      error.message,
    )
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

  if (
    error.message === "No active Mollie subscription to change." ||
    error.message === "No active Mollie subscription to upgrade."
  ) {
    return "No active subscription to change. Complete checkout first or contact support.";
  }

  if (error.message.includes("Mollie customer mapping missing")) {
    return "Billing profile is incomplete. Contact support to fix your subscription mapping.";
  }

  if (error.message === "Enterprise plan changes are manual-only.") {
    return "Enterprise plan changes are manual-only. Contact sales.";
  }

  if (
    error.message === UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE ||
    error.message.includes("upgrade payment is already in progress")
  ) {
    return UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE;
  }

  if (error.message === UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE) {
    return UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE;
  }

  if (error.message === UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE) {
    return UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE;
  }

  if (error.message.includes("Billing period boundaries")) {
    return "Billing sync is required before upgrade. Refresh billing or contact support.";
  }

  if (error.message.includes("cancellation is scheduled")) {
    return "Upgrades are unavailable while cancellation is scheduled.";
  }

  if (error.message.includes("No prorated amount due")) {
    return UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE;
  }

  if (error.message.includes("Mollie upgrade payment missing hosted checkout URL")) {
    return UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE;
  }

  if (error.message === PLAN_CHANGE_CANCEL_ALREADY_MESSAGE) {
    return PLAN_CHANGE_CANCEL_ALREADY_MESSAGE;
  }

  if (error.message === SUBSCRIPTION_CANCEL_ALREADY_MESSAGE) {
    return SUBSCRIPTION_CANCEL_ALREADY_MESSAGE;
  }

  if (error.message === SUBSCRIPTION_NOT_CANCELABLE_MESSAGE) {
    return SUBSCRIPTION_NOT_CANCELABLE_MESSAGE;
  }

  if (error.message.includes("Mollie did not confirm the restored plan amount")) {
    return "Unable to cancel the scheduled plan change right now. Try again or contact support.";
  }

  return null;
}

/** Expected duplicate/conflict plan-change guard — not a fatal checkout failure. */
export function isExpectedPlanChangeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("already scheduled") ||
      error.message === "This is your organization's current plan." ||
      error.message === PLAN_CHANGE_CANCEL_ALREADY_MESSAGE ||
      error.message === SUBSCRIPTION_CANCEL_ALREADY_MESSAGE ||
      error.message === UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE ||
      error.message === UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE ||
      error.message.includes("upgrade payment is already in progress"))
  );
}

/** Expected pre-purchase portal absence — must not be logged as an error. */
export function isExpectedPortalUnavailableError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === BILLING_PORTAL_UNAVAILABLE_MESSAGE ||
      error.message === FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE)
  );
}
