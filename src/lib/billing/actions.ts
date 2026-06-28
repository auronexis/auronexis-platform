"use server";



import { redirect } from "next/navigation";

import { z } from "zod";

import { requireSession } from "@/lib/auth/session";

import { createCheckoutSessionWithDiscount } from "@/lib/billing/checkout";

import { openCustomerPortal } from "@/lib/billing/customer-portal";

import { validateDiscountCode } from "@/lib/billing/discounts";

import { calculateProrationPreview } from "@/lib/billing/proration";

import { getBillingOverview } from "@/lib/billing/queries";

import type { PlanKey } from "@/lib/billing/plans";

import { getDefaultPlanKey } from "@/lib/plans/features";

import { AuthorizationError } from "@/lib/rbac/guards";

import { canManageOrganizationSettings } from "@/lib/team/guards";



export type BillingActionState = {

  error?: string;

  success?: string;

};



const planKeySchema = z.enum(["starter", "professional", "business", "enterprise"]);



/** Create a Stripe Checkout session for a selected plan — Owner/Admin only. */

export async function createCheckoutSessionAction(

  planKey: string,

  discountCode?: string | null,

): Promise<BillingActionState> {

  const session = await requireSession();



  if (!canManageOrganizationSettings(session)) {

    throw new AuthorizationError();

  }



  const parsed = planKeySchema.safeParse(planKey);



  if (!parsed.success) {

    return { error: "Invalid subscription plan selected." };

  }



  let checkoutUrl: string;



  try {

    checkoutUrl = await createCheckoutSessionWithDiscount({

      organizationId: session.organization.id,

      organizationName: session.organization.name,

      email: session.email,

      planKey: parsed.data,

      discountCode,

    });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Unable to start checkout.";

    return { error: message };

  }



  redirect(checkoutUrl);

}



/** Open the Stripe Customer Portal — Owner/Admin only. */

export async function createPortalSessionAction(): Promise<BillingActionState> {

  const session = await requireSession();



  if (!canManageOrganizationSettings(session)) {

    throw new AuthorizationError();

  }



  let portalUrl: string;



  try {

    portalUrl = await openCustomerPortal({

      organizationId: session.organization.id,

    });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Unable to open billing portal.";

    return { error: message };

  }



  redirect(portalUrl);

}



export async function validateDiscountCodeAction(

  _state: BillingActionState,

  formData: FormData,

): Promise<BillingActionState & { preview?: Awaited<ReturnType<typeof validateDiscountCode>> }> {

  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {

    throw new AuthorizationError();

  }



  const code = String(formData.get("discountCode") ?? "");

  const planKey = (String(formData.get("planKey") ?? getDefaultPlanKey()) as PlanKey) || getDefaultPlanKey();

  const result = await validateDiscountCode(code, planKey);



  if (!result.valid) {

    return { error: result.message };

  }



  return {

    success: `Code ${result.code} saves ${result.formattedSavings} on ${planKey}.`,

    preview: result,

  };

}



export async function previewProrationAction(

  targetPlanKey: string,

): Promise<BillingActionState & { preview?: ReturnType<typeof calculateProrationPreview> }> {

  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {

    throw new AuthorizationError();

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


