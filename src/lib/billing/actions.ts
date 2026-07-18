"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { createCheckoutSessionWithDiscount } from "@/lib/billing/checkout";
import { assertCheckoutAllowed } from "@/lib/billing/checkout-guards.server";
import { openCustomerPortal } from "@/lib/billing/customer-portal";
import {
  isExpectedPortalUnavailableError,
  sanitizeBillingCustomerError,
} from "@/lib/billing/errors";
import { PADDLE_PORTAL_UNAVAILABLE_MESSAGE } from "@/lib/billing/active-billing";
import { BILLING_PROMO_MESSAGES, formatPromoValidationSuccess } from "@/lib/billing/messages";
import { validateDiscountCode } from "@/lib/billing/discounts";
import { calculateProrationPreview } from "@/lib/billing/proration";
import { getBillingOverview } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import type { PaddleCheckoutCustomData } from "@/lib/billing/provider-types";
import { isInternalPlan } from "@/lib/billing/provider-types";
import { assertPlanCheckoutReady } from "@/lib/billing/stripe-config";
import type { PlanKey } from "@/lib/billing/plans";
import { getDefaultPlanKey } from "@/lib/plans/features";
import { createPaddleCheckoutPayload } from "@/lib/paddle/checkout";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export type BillingActionState = {
  error?: string;
  success?: string;
};

export type CheckoutActionResult = BillingActionState & {
  paddleCheckout?: {
    priceId: string;
    clientToken: string;
    environment: "sandbox" | "production";
    customData: PaddleCheckoutCustomData;
    pendingSyncMessage: string;
    customerEmail?: string;
  };
};

const planKeySchema = z.enum(["starter", "professional", "business", "enterprise"]);

/** Create checkout for the active billing provider — Owner/Admin only. */
export async function createCheckoutSessionAction(
  planKey: string,
  discountCode?: string | null,
): Promise<CheckoutActionResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = planKeySchema.safeParse(planKey);

  if (!parsed.success) {
    return { error: "Invalid subscription plan selected." };
  }

  if (parsed.data === "enterprise") {
    return { error: "Contact sales for Enterprise plans." };
  }

  if (parsed.data === "starter") {
    return { error: "Invalid subscription plan selected." };
  }

  if (!isInternalPlan(parsed.data)) {
    return { error: "Invalid subscription plan selected." };
  }

  const provider = getActiveBillingProvider();

  try {
    await assertCheckoutAllowed(session, parsed.data);

    if (provider === "paddle") {
      const paddleCheckout = await createPaddleCheckoutPayload({
        organizationId: session.organization.id,
        userId: session.user.id,
        planKey: parsed.data,
        email: session.email,
      });

      return {
        success: paddleCheckout.pendingSyncMessage,
        paddleCheckout: {
          priceId: paddleCheckout.priceId,
          clientToken: paddleCheckout.clientToken,
          environment: paddleCheckout.environment,
          customData: paddleCheckout.customData,
          pendingSyncMessage: paddleCheckout.pendingSyncMessage,
          customerEmail: session.email,
        },
      };
    }

    assertPlanCheckoutReady(parsed.data);
    const checkoutUrl = await createCheckoutSessionWithDiscount({
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      email: session.email,
      planKey: parsed.data,
      userId: session.user.id,
      discountCode,
    });
    redirect(checkoutUrl);
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
      // Expected before first completed Paddle purchase — informational only.
      return {
        error: sanitizeBillingCustomerError(error, PADDLE_PORTAL_UNAVAILABLE_MESSAGE),
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
