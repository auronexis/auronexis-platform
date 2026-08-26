/**
 * Standardized commercial / billing event catalog — maps to analytics + webhook outcomes.
 * Never attach org/customer/secret identifiers to third-party analytics payloads.
 *
 * Mollie is the sole active billing provider. Historical provider webhook catalogs
 * were removed with their runtimes.
 */

export const COMMERCIAL_EVENT_NAMES = [
  "checkout_started",
  "checkout_completed",
  "checkout_cancelled",
  "trial_started",
  "trial_converted",
  "payment_succeeded",
  "payment_failed",
  "subscription_updated",
  "subscription_renewed",
  "subscription_cancelled",
  "subscription_reactivated",
  "invoice_issued",
  "invoice_paid",
  "invoice_failed",
  "billing_portal_opened",
  "plan_selected",
] as const;

export type CommercialEventName = (typeof COMMERCIAL_EVENT_NAMES)[number];
