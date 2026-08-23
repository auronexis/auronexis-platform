import {
  safeGetPlanByKey,
  type PlanActionLabel,
  type PlanKey,
} from "@/lib/billing/plans";
import { formatBillingDate } from "@/lib/billing/types";
import type { OrganizationSubscription } from "@/types/database";

export const PLAN_CHANGE_ALREADY_SCHEDULED_MESSAGE =
  "This plan change is already scheduled.";

export const PLAN_CHANGE_CONFLICT_MESSAGE =
  "A different plan change is already scheduled. Wait for it to take effect or contact support.";

export const UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE =
  "An upgrade payment is already in progress. Complete checkout or wait for it to expire before retrying.";

export const UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE =
  "Upgrade payment was received and is syncing. Refresh billing in a moment — do not start a second checkout.";

export const UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE =
  "Upgrade checkout is temporarily unavailable. Try again shortly or contact support.";

export type ScheduledPlanChange = {
  pendingPlanKey: PlanKey;
  pendingPlanName: string;
  currentPlanKey: PlanKey;
  currentPlanName: string;
  changeType: "upgrade" | "downgrade";
  effectiveAt: string | null;
  effectiveAtLabel: string | null;
  providerChangeReference: string | null;
};

/** Authoritative scheduled change from subscription row — never conflates pending with current. */
export function resolveScheduledPlanChange(
  subscription: OrganizationSubscription | null | undefined,
): ScheduledPlanChange | null {
  if (!subscription?.pending_plan) {
    return null;
  }

  const pendingPlan = safeGetPlanByKey(subscription.pending_plan);
  const currentPlan = safeGetPlanByKey(subscription.provider_price_id);
  if (!pendingPlan || !currentPlan) {
    return null;
  }

  const changeType =
    subscription.pending_plan_change_type === "upgrade" ||
    subscription.pending_plan_change_type === "downgrade"
      ? subscription.pending_plan_change_type
      : pendingPlan.order > currentPlan.order
        ? "upgrade"
        : "downgrade";

  const effectiveAt = subscription.pending_plan_effective_at ?? null;

  return {
    pendingPlanKey: pendingPlan.key,
    pendingPlanName: pendingPlan.name,
    currentPlanKey: currentPlan.key,
    currentPlanName: currentPlan.name,
    changeType,
    effectiveAt,
    effectiveAtLabel: formatBillingDate(effectiveAt),
    providerChangeReference: subscription.provider_change_reference ?? null,
  };
}

export function formatPlanChangeScheduledSuccessMessage(input: {
  currentPlanName: string;
  targetPlanName: string;
  changeType: "upgrade" | "downgrade";
  effectiveAtLabel: string | null;
}): string {
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  const dateSuffix = input.effectiveAtLabel
    ? ` It is scheduled to take effect on ${input.effectiveAtLabel}.`
    : " It will take effect after Mollie confirms your next billing cycle.";
  return `${input.targetPlanName} ${direction} scheduled. ${input.currentPlanName} remains your current plan until then.${dateSuffix}`;
}

export function formatUpgradePaymentCheckoutMessage(input: {
  targetPlanName: string;
  formattedNetDue: string;
}): string {
  return `Continue to payment to upgrade to ${input.targetPlanName}. Prorated amount due now: ${input.formattedNetDue}.`;
}

export function formatScheduledPlanChangeSummary(scheduled: ScheduledPlanChange): string {
  const direction = scheduled.changeType === "upgrade" ? "Upgrade" : "Downgrade";
  const datePart = scheduled.effectiveAtLabel
    ? ` on ${scheduled.effectiveAtLabel}`
    : " at your next billing cycle";
  return `${direction} to ${scheduled.pendingPlanName} scheduled${datePart}. ${scheduled.currentPlanName} stays active until then.`;
}

export function resolvePlanCardAction(
  targetKey: PlanKey,
  currentKey: PlanKey | string | null | undefined,
  isUsable: boolean,
  scheduled: ScheduledPlanChange | null,
): PlanActionLabel {
  const target = safeGetPlanByKey(targetKey);
  const current = safeGetPlanByKey(currentKey);

  if (!target) {
    return "choose";
  }

  if (scheduled && scheduled.pendingPlanKey === target.key) {
    return "scheduled";
  }

  if (isUsable && current && current.key === target.key) {
    return "current";
  }

  if (!isUsable || !current) {
    return "choose";
  }

  if (target.order > current.order) {
    return "upgrade";
  }

  if (target.order < current.order) {
    return "downgrade";
  }

  return "choose";
}

export function getScheduledPlanBadgeLabel(changeType: "upgrade" | "downgrade"): string {
  return changeType === "upgrade" ? "Upgrade scheduled" : "Downgrade scheduled";
}

export function buildPlanChangeScheduledTemplateKey(
  providerChangeReference: string,
  targetPlanKey: string,
): string {
  return `plan_change_scheduled:${providerChangeReference}:${targetPlanKey}`;
}

export function buildPlanChangeAppliedTemplateKey(
  providerChangeReference: string,
  appliedPlanKey: string,
): string {
  return `plan_change_applied:${providerChangeReference}:${appliedPlanKey}`;
}

/**
 * Deterministic ledger key for exactly-one upgrade activation email.
 * Format: upgrade_activated:org/sub/payment/previous->applied
 */
export function buildUpgradeActivatedTemplateKey(input: {
  organizationId: string;
  providerSubscriptionId: string;
  providerPaymentId: string;
  previousPlanKey: string;
  appliedPlanKey: string;
}): string {
  return [
    "upgrade_activated",
    input.organizationId.trim(),
    input.providerSubscriptionId.trim(),
    input.providerPaymentId.trim(),
    `${input.previousPlanKey.trim()}->${input.appliedPlanKey.trim()}`,
  ].join(":");
}

export function resolvePlanChangeEmailPlans(input: {
  previousPlanKey: string;
  targetPlanKey: string;
}): { previousPlanName: string; targetPlanName: string } {
  return {
    previousPlanName: safeGetPlanByKey(input.previousPlanKey)?.name ?? input.previousPlanKey,
    targetPlanName: safeGetPlanByKey(input.targetPlanKey)?.name ?? input.targetPlanKey,
  };
}
