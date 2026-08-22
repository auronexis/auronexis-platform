import { formatBillingDate } from "@/lib/billing/types";
import {
  isSubscriptionCanceled,
  isSubscriptionUsable,
  normalizeSubscriptionStatus,
} from "@/lib/billing/status";
import { safeGetPlanByKey } from "@/lib/billing/plans";
import type { OrganizationSubscription } from "@/types/database";

export const PLAN_CHANGE_CANCEL_ALREADY_MESSAGE =
  "Scheduled plan change has already been canceled.";

export const SUBSCRIPTION_CANCEL_ALREADY_MESSAGE =
  "Subscription cancellation is already scheduled.";

export const SUBSCRIPTION_NOT_CANCELABLE_MESSAGE =
  "No active subscription to cancel. Complete checkout first or contact support.";

export type SubscriptionManagementState = {
  cancelAtPeriodEnd: boolean;
  isPaidThrough: boolean;
  accessUntil: string | null;
  accessUntilLabel: string | null;
  statusLabel: string;
  renewalLabel: string;
  canCancelSubscription: boolean;
  canCancelScheduledPlanChange: boolean;
  canResumeSubscription: false;
};

/** Paid access continues until current_period_end when cancel_at_period_end is set. */
export function isSubscriptionPaidThroughPeriodEnd(input: {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null | undefined;
  now?: Date;
}): boolean {
  if (!input.cancelAtPeriodEnd) {
    return false;
  }

  if (!input.currentPeriodEnd) {
    return true;
  }

  const end = new Date(input.currentPeriodEnd);
  if (Number.isNaN(end.getTime())) {
    return true;
  }

  return end > (input.now ?? new Date());
}

/**
 * Entitlements and billing UI must not rely on raw Mollie canceled status alone when
 * cancel_at_period_end preserves paid-through access.
 */
export function resolveSubscriptionUsability(
  subscription: OrganizationSubscription | null | undefined,
  rawStatus: string | null | undefined,
): boolean {
  if (isSubscriptionUsable(rawStatus)) {
    return true;
  }

  if (!subscription) {
    return false;
  }

  if (
    isSubscriptionPaidThroughPeriodEnd({
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
    })
  ) {
    const normalized = normalizeSubscriptionStatus(rawStatus);
    return isSubscriptionUsable(normalized) || isSubscriptionCanceled(normalized);
  }

  return false;
}

export function resolveSubscriptionManagementState(
  subscription: OrganizationSubscription | null | undefined,
  rawStatus: string | null | undefined,
): SubscriptionManagementState {
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false;
  const isPaidThrough = isSubscriptionPaidThroughPeriodEnd({
    cancelAtPeriodEnd,
    currentPeriodEnd: subscription?.current_period_end,
  });
  const accessUntil = subscription?.current_period_end ?? null;
  const accessUntilLabel = formatBillingDate(accessUntil);
  const isUsable = resolveSubscriptionUsability(subscription, rawStatus);
  const hasPendingPlanChange = Boolean(subscription?.pending_plan);

  let statusLabel = "No active subscription";
  if (isUsable && cancelAtPeriodEnd && isPaidThrough) {
    statusLabel = "Active — cancellation scheduled";
  } else if (isUsable) {
    statusLabel = "Active";
  } else if (isSubscriptionCanceled(rawStatus)) {
    statusLabel = "Canceled";
  } else if (rawStatus) {
    statusLabel = normalizeSubscriptionStatus(rawStatus) === "inactive" ? "No active subscription" : rawStatus;
  }

  const renewalLabel = cancelAtPeriodEnd && isPaidThrough ? "Canceled" : accessUntilLabel ?? "—";

  return {
    cancelAtPeriodEnd,
    isPaidThrough,
    accessUntil,
    accessUntilLabel,
    statusLabel,
    renewalLabel,
    canCancelSubscription: isUsable && !cancelAtPeriodEnd && Boolean(subscription?.provider_subscription_id),
    canCancelScheduledPlanChange: hasPendingPlanChange && !cancelAtPeriodEnd,
    canResumeSubscription: false,
  };
}

export function formatPlanChangeCanceledSuccessMessage(input: {
  currentPlanName: string;
  changeType: "upgrade" | "downgrade";
}): string {
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  return `Scheduled ${direction} canceled. Your ${input.currentPlanName} plan will continue unchanged.`;
}

export function formatSubscriptionCancellationScheduledSuccessMessage(input: {
  planName: string;
  accessUntilLabel: string | null;
}): string {
  const datePart = input.accessUntilLabel
    ? ` until ${input.accessUntilLabel}`
    : " until the end of your current billing period";
  return `Cancellation scheduled. You keep ${input.planName} access${datePart}.`;
}

export function buildPlanChangeCanceledTemplateKey(
  providerChangeReference: string,
  pendingPlanKey: string,
): string {
  return `plan_change_canceled:${providerChangeReference}:${pendingPlanKey}`;
}

export function buildSubscriptionCancellationScheduledTemplateKey(
  providerSubscriptionId: string,
  accessUntil: string | null,
): string {
  const suffix = accessUntil ?? "period_end";
  return `subscription_cancellation_scheduled:${providerSubscriptionId}:${suffix}`;
}

export function buildSubscriptionEndedTemplateKey(
  providerSubscriptionId: string,
  accessUntil: string | null,
): string {
  const suffix = accessUntil ?? "ended";
  return `subscription_ended:${providerSubscriptionId}:${suffix}`;
}

export function resolveSubscriptionEmailPlanName(planKey: string | null | undefined): string {
  return safeGetPlanByKey(planKey)?.name ?? planKey ?? "your plan";
}
