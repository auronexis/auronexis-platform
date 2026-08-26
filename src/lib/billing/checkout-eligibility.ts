import "server-only";

import {
  hasVerifiedMollieSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
import { isLegacyQuarantinedSubscriptionRow } from "@/lib/billing/legacy-quarantine";
import type { BillingProvider } from "@/lib/billing/provider-types";
import {
  isMollieDefaultForNewSubscriptions,
  isMollieLiveChargingEnabled,
  isMollieProductionCheckoutEligible,
} from "@/lib/billing/providers/mollie/rollout";
import { isMollieApiConfigured } from "@/lib/billing/providers/mollie/env";
import { getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";
import { isMollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import type { OrganizationSubscription } from "@/types/database";

/** Local config probe — avoids circular import with production-checkout. */
function isMollieCheckoutConfigured(): boolean {
  if (!isMollieApiConfigured()) {
    return false;
  }
  const mode = getMollieCredentialMode();
  if (mode === "test") {
    return true;
  }
  if (mode === "live") {
    return isMollieLiveChargingEnabled();
  }
  return false;
}

/**
 * Checkout eligibility codes — server-side only.
 * Used to block cross-provider double billing and duplicate Mollie purchases.
 */
export type CheckoutEligibilityCode =
  | "allowed_mollie"
  | "allowed_mollie_plan_change"
  | "existing_subscription"
  | "provider_conflict"
  | "duplicate_mollie"
  | "not_eligible"
  | "live_charging_disabled"
  | "provider_not_configured"
  | "enterprise_manual"
  | "invalid_plan"
  | "historical_provider_retired";

export type CheckoutEligibilityResult =
  | {
      allowed: true;
      provider: "mollie";
      code: "allowed_mollie" | "allowed_mollie_plan_change";
      reason: string;
    }
  | {
      allowed: false;
      provider: BillingProvider | null;
      code: Exclude<CheckoutEligibilityCode, "allowed_mollie" | "allowed_mollie_plan_change">;
      reason: string;
    };

function hasActiveMollieSubscription(row: OrganizationSubscription | null | undefined): boolean {
  if (!hasVerifiedMollieSubscription(row)) {
    return false;
  }
  const status = row?.provider_status ?? row?.status;
  return resolveSubscriptionUsability(row, status);
}

function resolveNewMollieCheckoutEligibility(input: {
  organizationId: string;
  planKey: string;
  resolvedProvider: BillingProvider;
}): CheckoutEligibilityResult {
  if (!isMollieSelfServePlanKey(input.planKey)) {
    return {
      allowed: false,
      provider: "mollie",
      code: "invalid_plan",
      reason: "Invalid subscription plan selected.",
    };
  }

  if (!isMollieProductionCheckoutEligible(input.organizationId)) {
    return {
      allowed: false,
      provider: "mollie",
      code: "not_eligible",
      reason: "This workspace is not enabled for Mollie billing yet.",
    };
  }

  if (!isMollieCheckoutConfigured()) {
    const modeBlocked =
      process.env.MOLLIE_API_KEY?.trim().startsWith("live_") && !isMollieLiveChargingEnabled();
    return {
      allowed: false,
      provider: "mollie",
      code: modeBlocked ? "live_charging_disabled" : "provider_not_configured",
      reason: modeBlocked
        ? "Mollie LIVE charging is disabled."
        : "Mollie checkout is not configured for this workspace.",
    };
  }

  return {
    allowed: true,
    provider: "mollie",
    code: "allowed_mollie",
    reason: isMollieDefaultForNewSubscriptions()
      ? "mollie_default_for_new_subscriptions"
      : "mollie_allowlist_eligible",
  };
}

/**
 * Central checkout eligibility for Plans/Billing self-serve.
 *
 * Safety:
 * - Legacy stripe/paddle/fastspring rows are quarantined — never block Mollie checkout.
 * - Mollie-backed org → Mollie plan change or recovery only.
 * - Active Mollie sub_ → plan change only (no duplicate first payment).
 * - New Mollie when rollout/allowlist and configured.
 * - LIVE kill switch is separate from rollout; LIVE writes still fail closed in mode guards.
 */
export function resolveCheckoutEligibility(input: {
  organizationId: string;
  subscription?: OrganizationSubscription | null;
  targetPlanKey: string;
  /** Provider already resolved for this org (ownership → eligibility → default). */
  resolvedProvider: BillingProvider;
}): CheckoutEligibilityResult {
  const subscription = input.subscription ?? null;
  const planKey = input.targetPlanKey;

  if (planKey === "enterprise") {
    return {
      allowed: false,
      provider: input.resolvedProvider,
      code: "enterprise_manual",
      reason: "Enterprise is manual-only. Contact sales to arrange an enterprise plan.",
    };
  }

  if (planKey === "starter" || !planKey) {
    return {
      allowed: false,
      provider: input.resolvedProvider,
      code: "invalid_plan",
      reason: "Invalid subscription plan selected.",
    };
  }

  if (
    subscription &&
    isLegacyQuarantinedSubscriptionRow(subscription) &&
    !isMollieBackedSubscription(subscription)
  ) {
    return resolveNewMollieCheckoutEligibility({
      organizationId: input.organizationId,
      planKey,
      resolvedProvider: input.resolvedProvider,
    });
  }

  if (isMollieBackedSubscription(subscription)) {
    if (!isMollieSelfServePlanKey(planKey)) {
      return {
        allowed: false,
        provider: "mollie",
        code: "invalid_plan",
        reason: "Invalid subscription plan selected.",
      };
    }

    if (!isMollieCheckoutConfigured()) {
      const modeBlocked =
        process.env.MOLLIE_API_KEY?.trim().startsWith("live_") && !isMollieLiveChargingEnabled();
      return {
        allowed: false,
        provider: "mollie",
        code: modeBlocked ? "live_charging_disabled" : "provider_not_configured",
        reason: modeBlocked
          ? "Mollie LIVE charging is disabled. Contact support if you expected LIVE billing."
          : "Mollie checkout is not configured for this workspace. Contact support if you expected Mollie billing.",
      };
    }

    if (hasActiveMollieSubscription(subscription)) {
      return {
        allowed: true,
        provider: "mollie",
        code: "allowed_mollie_plan_change",
        reason: "existing_mollie_subscription_plan_change",
      };
    }

    if (hasVerifiedMollieSubscription(subscription) && !hasActiveMollieSubscription(subscription)) {
      const status = (subscription?.provider_status ?? subscription?.status ?? "").toLowerCase();
      if (status === "suspended" || status === "past_due") {
        return {
          allowed: false,
          provider: "mollie",
          code: "existing_subscription",
          reason:
            "A Mollie subscription already exists for this workspace. Resolve payment issues or contact support — do not start a second subscription.",
        };
      }
    }

    if (subscription?.sync_pending && hasVerifiedMollieSubscription(subscription)) {
      return {
        allowed: false,
        provider: "mollie",
        code: "duplicate_mollie",
        reason: "A Mollie subscription sync is already in progress. Wait for confirmation before retrying.",
      };
    }

    return {
      allowed: true,
      provider: "mollie",
      code: "allowed_mollie",
      reason: "existing_mollie_ownership_new_or_recovery_checkout",
    };
  }

  if (input.resolvedProvider === "mollie") {
    return resolveNewMollieCheckoutEligibility({
      organizationId: input.organizationId,
      planKey,
      resolvedProvider: input.resolvedProvider,
    });
  }

  return {
    allowed: false,
    provider: input.resolvedProvider,
    code: "provider_not_configured",
    reason: "Billing checkout is not available for this workspace. Contact support.",
  };
}
