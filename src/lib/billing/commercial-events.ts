/**
 * Standardized commercial / billing event catalog — maps to analytics + webhook outcomes.
 * Never attach org/customer/secret identifiers to third-party analytics payloads.
 */

export const PADDLE_WEBHOOK_EVENT_TYPES = [
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.paused",
  "subscription.resumed",
  "subscription.trialing",
  "subscription.past_due",
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
  "transaction.updated",
  "customer.created",
  "customer.updated",
] as const;

export type PaddleWebhookEventType = (typeof PADDLE_WEBHOOK_EVENT_TYPES)[number];

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
