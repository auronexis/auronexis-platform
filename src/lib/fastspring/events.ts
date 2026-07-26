/**
 * Exact FastSpring event names selected for the Auroranexis webhook foundation.
 * Do not rename or invent Stripe-style equivalents.
 */
export const FASTSPRING_ORDER_EVENT_TYPES = [
  "order.completed",
  "order.canceled",
  "order.failed",
  "order.payment.pending",
] as const;

export const FASTSPRING_SUBSCRIPTION_EVENT_TYPES = [
  "subscription.activated",
  "subscription.deactivated",
  "subscription.canceled",
  "subscription.uncanceled",
  "subscription.updated",
  "subscription.payment.overdue",
  "subscription.paused",
  "subscription.resumed",
  "subscription.charge.completed",
  "subscription.charge.failed",
] as const;

export const FASTSPRING_HANDLED_EVENT_TYPES = [
  ...FASTSPRING_ORDER_EVENT_TYPES,
  ...FASTSPRING_SUBSCRIPTION_EVENT_TYPES,
] as const;

export type FastSpringHandledEventType = (typeof FASTSPRING_HANDLED_EVENT_TYPES)[number];

const HANDLED_SET = new Set<string>(FASTSPRING_HANDLED_EVENT_TYPES);

export function isFastSpringHandledEventType(value: string): value is FastSpringHandledEventType {
  return HANDLED_SET.has(value);
}

export function isFastSpringSubscriptionEventType(value: string): boolean {
  return (FASTSPRING_SUBSCRIPTION_EVENT_TYPES as readonly string[]).includes(value);
}

export function isFastSpringOrderEventType(value: string): boolean {
  return (FASTSPRING_ORDER_EVENT_TYPES as readonly string[]).includes(value);
}
