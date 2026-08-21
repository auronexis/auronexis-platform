"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { assertCheckoutAllowed } from "@/lib/billing/checkout-guards.server";
import { resolveCheckoutEligibility } from "@/lib/billing/checkout-eligibility";
import { trackBillingLifecycleEvent } from "@/lib/analytics/billing-lifecycle";
import { openCustomerPortal } from "@/lib/billing/customer-portal";
import {
  isExpectedPortalUnavailableError,
  sanitizeBillingCustomerError,
} from "@/lib/billing/errors";
import { FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";
import { BILLING_PROMO_MESSAGES, formatPromoValidationSuccess } from "@/lib/billing/messages";
import { validateDiscountCode } from "@/lib/billing/discounts";
import { calculateProrationPreview } from "@/lib/billing/proration";
import { getBillingOverview } from "@/lib/billing/queries";
import { isInternalPlan } from "@/lib/billing/provider-types";
import type { PlanKey } from "@/lib/billing/plans";
import type { FastSpringProductPath } from "@/lib/billing/catalog";
import { getDefaultPlanKey } from "@/lib/plans/features";
import {
  createFastSpringCheckoutPayloadForPlan,
  isFastSpringCheckoutConfigured,
} from "@/lib/fastspring/checkout";
import type { FastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import {
  createMollieProductionFirstPayment,
  isMollieProductionCheckoutConfigured,
} from "@/lib/billing/providers/mollie/production-checkout";
import { isMollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import {
  cancelMollieOrganizationSubscription,
  changeMollieOrganizationPlan,
} from "@/lib/billing/providers/mollie/lifecycle";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type BillingActionState = {
  error?: string;
  success?: string;
};

export type CheckoutActionResult = BillingActionState & {
  fastspringCheckout?: {
    storefront: string;
    sblScriptSrc: string;
    productPath: FastSpringProductPath;
    tags: FastSpringCheckoutTags;
    checkoutMode: "test" | "live";
    pendingSyncMessage: string;
  };
  mollieCheckout?: {
    checkoutUrl: string;
    checkoutAttemptId: string;
    pendingSyncMessage: string;
  };
};

const planKeySchema = z.enum(["starter", "professional", "business", "enterprise"]);

/** Create checkout for the active billing provider. Owner/Admin only. */
export async function createCheckoutSessionAction(
  planKey: string,
): Promise<CheckoutActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = planKeySchema.safeParse(planKey);

  if (!parsed.success) {
    return { error: "Invalid subscription plan selected." };
  }

  if (parsed.data === "starter") {
    return { error: "Invalid subscription plan selected." };
  }

  if (!isInternalPlan(parsed.data)) {
    return { error: "Invalid subscription plan selected." };
  }

  try {
    await assertCheckoutAllowed(session, parsed.data);

    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    const eligibility = resolveCheckoutEligibility({
      organizationId: session.organization.id,
      subscription,
      targetPlanKey: parsed.data,
      resolvedProvider: orgProvider,
    });

    if (!eligibility.allowed) {
      return { error: eligibility.reason };
    }

    if (eligibility.provider === "mollie") {
      if (parsed.data === "enterprise") {
        return {
          error: "Enterprise is manual-only. Contact sales to arrange an enterprise plan.",
        };
      }

      if (!isMollieSelfServePlanKey(parsed.data)) {
        return { error: "Invalid subscription plan selected." };
      }

      if (!isMollieProductionCheckoutConfigured()) {
        return {
          error:
            "Mollie checkout is not configured for this workspace. Contact support if you expected Mollie billing.",
        };
      }

      // Existing usable Mollie subscription → plan change (no new first payment).
      if (eligibility.code === "allowed_mollie_plan_change") {
        await changeMollieOrganizationPlan({
          organizationId: session.organization.id,
          targetPlanKey: parsed.data,
        });
        return {
          success:
            "Plan change scheduled with Mollie. Your current plan stays active until Mollie confirms the next billing cycle — then entitlements update.",
        };
      }

      const checkout = await createMollieProductionFirstPayment({
        organizationId: session.organization.id,
        organizationName: session.organization.name,
        ownerEmail: session.email,
        planKey: parsed.data,
      });

      return {
        success: checkout.pendingSyncMessage,
        mollieCheckout: {
          checkoutUrl: checkout.checkoutUrl,
          checkoutAttemptId: checkout.checkoutAttemptId,
          pendingSyncMessage: checkout.pendingSyncMessage,
        },
      };
    }

    // Mollie-owned orgs must never fall through to FastSpring (provider_conflict).
    if (orgProvider === "mollie") {
      return {
        error:
          "This workspace is billed via Mollie. FastSpring checkout is blocked to prevent double billing.",
      };
    }

    if (!isFastSpringCheckoutConfigured()) {
      return {
        error:
          "FastSpring checkout is not configured yet. Set FASTSPRING_STOREFRONT to the exact data-storefront value from the FastSpring dashboard.",
      };
    }

    const checkout = createFastSpringCheckoutPayloadForPlan({
      organizationId: session.organization.id,
      userId: session.user.id,
      planKey: parsed.data,
    });

    const pendingSyncMessage =
      "Checkout opened. Access updates after FastSpring confirms payment — this may take a moment.";

    return {
      success: pendingSyncMessage,
      fastspringCheckout: {
        storefront: checkout.storefront,
        sblScriptSrc: checkout.sblScriptSrc,
        productPath: checkout.productPath,
        tags: checkout.tags,
        checkoutMode: checkout.mode,
        pendingSyncMessage,
      },
    };
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("[billing][checkout] failed", error);
    return {
      error: sanitizeBillingCustomerError(error, "Unable to start checkout."),
    };
  }
}

/** Cancel Mollie subscription for Mollie-backed orgs — Owner/Admin only. */
export async function cancelMollieSubscriptionAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  try {
    const subscription = await getOrganizationSubscription(session);
    const orgProvider = getOrganizationBillingProvider({
      organizationId: session.organization.id,
      subscription,
    });

    if (orgProvider !== "mollie") {
      return {
        error: "Cancellation via this action is only available for Mollie-billed workspaces.",
      };
    }

    await cancelMollieOrganizationSubscription({
      organizationId: session.organization.id,
    });

    return {
      success:
        "Subscription canceled immediately with Mollie. Access ends after Mollie confirms cancellation.",
    };
  } catch (error) {
    console.error("[billing][mollie-cancel] failed", error);
    return {
      error: sanitizeBillingCustomerError(error, "Unable to cancel subscription."),
    };
  }
}

/** Open the provider-specific customer portal — Owner/Admin only. */
export async function createPortalSessionAction(): Promise<BillingActionState> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  let portalUrl: string;

  try {
    portalUrl = await openCustomerPortal({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      email: session.email,
    });
  } catch (error) {
    if (isExpectedPortalUnavailableError(error)) {
      // Expected — FastSpring does not expose a hosted customer portal.
      return {
        error: sanitizeBillingCustomerError(error, FASTSPRING_PORTAL_UNAVAILABLE_MESSAGE),
      };
    }
    console.error(
      "[billing][portal] failed",
      error instanceof Error ? error.message : "unknown_error",
    );
    return {
      error: sanitizeBillingCustomerError(error, "Unable to open billing portal."),
    };
  }

  void trackBillingLifecycleEvent("billing_portal_opened", {
    result: "success",
    source: "customer_portal",
  });

  redirect(portalUrl);
}

export async function validateDiscountCodeAction(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState & { preview?: Awaited<ReturnType<typeof validateDiscountCode>> }> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const code = String(formData.get("discountCode") ?? "");
  const planKey =
    (String(formData.get("planKey") ?? getDefaultPlanKey()) as PlanKey) || getDefaultPlanKey();
  const result = await validateDiscountCode(code, planKey);

  if (!result.valid) {
    if ("silent" in result && result.silent) {
      return {};
    }
    return { error: result.message || BILLING_PROMO_MESSAGES.NOT_APPLIED };
  }

  return {
    success: formatPromoValidationSuccess(result.code, result.formattedSavings),
    preview: result,
  };
}

export async function previewProrationAction(
  targetPlanKey: string,
): Promise<BillingActionState & { preview?: ReturnType<typeof calculateProrationPreview> }> {
  const session = await requireSession();
  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = planKeySchema.safeParse(targetPlanKey);
  if (!parsed.success) {
    return { error: "Invalid target plan." };
  }

  const overview = await getBillingOverview(session);
  const currentPlanKey = overview.currentPlanKey ?? getDefaultPlanKey();
  const periodStart = overview.subscription?.current_period_start
    ? new Date(overview.subscription.current_period_start)
    : new Date();
  const periodEnd = overview.subscription?.current_period_end
    ? new Date(overview.subscription.current_period_end)
    : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  const preview = calculateProrationPreview({
    fromPlanKey: currentPlanKey,
    toPlanKey: parsed.data,
    periodStart,
    periodEnd,
  });

  return {
    success: `Estimated ${preview.direction} adjustment: ${preview.formattedNetDue}`,
    preview,
  };
}
