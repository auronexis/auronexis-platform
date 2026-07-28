"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { assertCheckoutAllowed } from "@/lib/billing/checkout-guards.server";
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
