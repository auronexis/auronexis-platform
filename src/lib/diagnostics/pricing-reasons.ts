import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import type { StripeBillingUiStatus } from "@/lib/billing/types";

export function getPricingButtonDisabledReasons(input: {
  planKey: PlanKey;
  currentPlanKey: PlanKey | null;
  isActive: boolean;
  canManage: boolean;
  isLoading: boolean;
  isCurrent: boolean;
  seatBlockMessage: string | null;
  stripeStatus: StripeBillingUiStatus;
}): string[] {
  const reasons: string[] = [];

  if (input.planKey === "enterprise") {
    return reasons;
  }

  if (!input.canManage) {
    reasons.push("Organization owners and admins can change plans.");
  }

  if (input.isCurrent) {
    reasons.push("This is your organization's current plan.");
  }

  if (input.isLoading) {
    reasons.push("Checkout is in progress.");
  }

  if (input.seatBlockMessage) {
    reasons.push(input.seatBlockMessage);
  }

  if (!input.stripeStatus.planCheckoutReady[input.planKey]) {
    if (!input.stripeStatus.checkoutAvailable) {
      reasons.push("Billing is currently unavailable.");
    } else {
      reasons.push("Checkout temporarily unavailable.");
    }
  }

  return reasons;
}

export function isPricingButtonDisabled(
  planKey: PlanKey,
  reasons: string[],
): boolean {
  if (planKey === "enterprise") {
    return false;
  }

  return reasons.length > 0;
}

export function getPricingUnavailableMessage(stripeStatus: StripeBillingUiStatus): string | null {
  if (stripeStatus.checkoutAvailable) {
    return null;
  }

  return "Billing is currently unavailable. Contact sales if you need help choosing a plan.";
}

export function getPlanCheckoutHint(
  planKey: PlanKey,
  stripeStatus: StripeBillingUiStatus,
): string | null {
  if (planKey === "enterprise") {
    return null;
  }

  if (stripeStatus.planCheckoutReady[planKey]) {
    return null;
  }

  if (!stripeStatus.checkoutAvailable) {
    return "Billing is currently unavailable.";
  }

  return "Checkout temporarily unavailable.";
}

export function getPlanDisplayName(planKey: PlanKey): string {
  return getPlanByKey(planKey).name;
}
