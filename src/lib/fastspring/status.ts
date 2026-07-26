import type { NormalizedSubscriptionStatus } from "@/lib/billing/provider-types";
import type { FastSpringHandledEventType } from "@/lib/fastspring/events";

/**
 * Confirmed FastSpring subscription `state` values from webhook expansion docs:
 * "active", "overdue", "canceled", "deactivated", "trial"
 * (https://developer.fastspring.com/reference/webhook-expansion)
 *
 * Event types may also imply a transition when `state` is absent.
 */
export function mapFastSpringSubscriptionState(
  state: string | null | undefined,
): NormalizedSubscriptionStatus | null {
  switch ((state ?? "").trim().toLowerCase()) {
    case "active":
      return "active";
    case "trial":
      return "trialing";
    case "overdue":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "deactivated":
      return "inactive";
    case "paused":
      return "paused";
    default:
      return null;
  }
}

/**
 * Resolve normalized status from event type + optional FastSpring state.
 * Prefer explicit `state` when known; otherwise map from the event name.
 */
export function resolveFastSpringSubscriptionStatus(input: {
  eventType: FastSpringHandledEventType | string;
  state: string | null | undefined;
  active?: boolean | null;
}): NormalizedSubscriptionStatus | null {
  const fromState = mapFastSpringSubscriptionState(input.state);
  if (fromState) {
    return fromState;
  }

  switch (input.eventType) {
    case "subscription.activated":
    case "subscription.uncanceled":
    case "subscription.resumed":
    case "subscription.charge.completed":
      return input.active === false ? "inactive" : "active";
    case "subscription.deactivated":
      return "inactive";
    case "subscription.canceled":
      return "canceled";
    case "subscription.payment.overdue":
      return "past_due";
    case "subscription.paused":
      return "paused";
    case "subscription.charge.failed":
      return "payment_failed";
    case "subscription.updated":
      // Without a confirmed state, do not invent a status write.
      return null;
    default:
      return null;
  }
}

export function mapFastSpringOrderEventToTransactionStatus(
  eventType: string,
): string {
  switch (eventType) {
    case "order.completed":
      return "paid";
    case "order.failed":
      return "payment_failed";
    case "order.canceled":
      return "canceled";
    case "order.payment.pending":
      return "pending";
    case "subscription.charge.completed":
      return "paid";
    case "subscription.charge.failed":
      return "payment_failed";
    default:
      return "unknown";
  }
}
