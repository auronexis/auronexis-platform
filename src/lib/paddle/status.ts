import type { NormalizedSubscriptionStatus } from "@/lib/billing/provider-types";

/**
 * Map verified Paddle subscription status → internal normalized status.
 * Raw Paddle status is always preserved separately in provider_status.
 */
export function mapPaddleSubscriptionStatus(
  paddleStatus: string | null | undefined,
): NormalizedSubscriptionStatus {
  switch ((paddleStatus ?? "").trim().toLowerCase()) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    default:
      return "inactive";
  }
}

/**
 * True only when Paddle scheduled_change action is cancel.
 * Plan changes / pauses must not set cancel_at_period_end.
 */
export function isPaddleCancelScheduledChange(scheduledChange: unknown): boolean {
  if (!scheduledChange || typeof scheduledChange !== "object") {
    return false;
  }
  const action = (scheduledChange as Record<string, unknown>).action;
  return typeof action === "string" && action.trim().toLowerCase() === "cancel";
}

export function mapPaddleTransactionStatus(
  paddleStatus: string | null | undefined,
): string {
  switch ((paddleStatus ?? "").trim().toLowerCase()) {
    case "completed":
    case "paid":
      return "paid";
    case "payment_failed":
    case "failed":
      return "payment_failed";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "draft":
    case "ready":
    case "billed":
      return "pending";
    default:
      return (paddleStatus ?? "unknown").toLowerCase();
  }
}
