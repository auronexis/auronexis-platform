import type { Metadata } from "next";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { FormAlert } from "@/components/ui/form-alert";
import { getPublicSelfServePlans } from "@/lib/billing/plans";
import { getPlansPageBillingState } from "@/lib/billing/queries";
import { resolveCheckoutBlockState } from "@/lib/billing/checkout-block";
import { getBillingUiStatus } from "@/lib/billing/ui-status";
import { resolveEnterpriseContactHref } from "@/lib/billing/enterprise-contact";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { hasVerifiedPaddleCustomer } from "@/lib/billing/active-billing";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getClientLimitUsageForSession } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  buildPricingSelectionContext,
  createFallbackPricingSelection,
} from "@/lib/pricing/selection-context";
import {
  FALLBACK_BILLING_UI_STATUS,
  normalizeBillingUiStatus,
} from "@/lib/billing/ui-status-client";
import { getPaddleEnvironment, isPaddleConfigured } from "@/lib/paddle/env";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description: "Compare Professional, Business, and Enterprise plans for your agency.",
};

export default async function WorkspacePlansPage() {
  await requireModuleAccess("pricing");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);

  let billingState;
  let seatUsage = { used: 0 };
  let clientUsage = { used: 0 };
  let stripeStatus = FALLBACK_BILLING_UI_STATUS;
  const enterpriseContactHref = resolveEnterpriseContactHref(session.role);

  let sandboxCheckoutNotice: string | null = null;
  try {
    if (getActiveBillingProvider() === "paddle" && isPaddleConfigured()) {
      if (getPaddleEnvironment() === "sandbox") {
        sandboxCheckoutNotice =
          "Sandbox checkout is active for billing tests. This is not a live production payment flow.";
      }
    }
  } catch {
    sandboxCheckoutNotice = null;
  }

  try {
    stripeStatus = normalizeBillingUiStatus(getBillingUiStatus());
  } catch (error) {
    console.warn("[plans] stripe status unavailable — using fallback flags", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    [billingState, seatUsage, clientUsage] = await Promise.all([
      getPlansPageBillingState(session),
      getOrganizationSeatUsageFromSession(session).catch(() => ({
        organizationId: session.organization.id,
        limit: 1,
        used: 0,
        activeUsers: 0,
        pendingInvitations: 0,
        isOverLimit: false,
        isAtLimit: false,
        planKey: null,
      })),
      getClientLimitUsageForSession(session).catch(() => ({
        used: 0,
        limit: null,
        isAtLimit: false,
        isOverLimit: false,
      })),
    ]);
  } catch (error) {
    console.error("[plans] page loader failed — rendering fallback pricing state", {
      message: error instanceof Error ? error.message : String(error),
      organizationId: session.organization.id,
    });

    billingState = {
      overview: createFallbackPricingSelection(canManage).overview,
      invoices: [],
      resolvedPlanKey: null,
      currentPlanKey: null,
      currentPlan: null,
      currentPlanName: null,
      checkoutBlock: resolveCheckoutBlockState({
        overview: createFallbackPricingSelection(canManage).overview,
        invoices: [],
        activeProvider: (() => {
          try {
            return getActiveBillingProvider();
          } catch {
            return "paddle";
          }
        })(),
      }),
      ignoredStripeInvoiceIds: new Set<string>(),
    };
  }

  const selection = buildPricingSelectionContext({
    overview: billingState.overview,
    invoices: billingState.invoices,
    canManage,
    usedSeats: seatUsage.used,
    usedClients: clientUsage.used,
    currentPlanKey: billingState.currentPlanKey,
    currentPlan: billingState.currentPlan,
    currentPlanName: billingState.currentPlanName,
    ignoredStripeInvoiceIds: billingState.ignoredStripeInvoiceIds,
  });

  let activeProvider: "stripe" | "paddle" = "paddle";
  try {
    activeProvider = getActiveBillingProvider();
  } catch {
    activeProvider = "paddle";
  }

  const showPortalAction =
    activeProvider === "paddle"
      ? hasVerifiedPaddleCustomer(billingState.overview.subscription)
      : true;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-1 py-2">
      <PricingHero />
      {sandboxCheckoutNotice ? <FormAlert variant="warning">{sandboxCheckoutNotice}</FormAlert> : null}
      <PricingGrid
        plans={getPublicSelfServePlans()}
        selection={selection}
        stripeStatus={stripeStatus}
        enterpriseContactHref={enterpriseContactHref}
        checkoutBlock={billingState.checkoutBlock}
        canManage={canManage}
        showPortalAction={showPortalAction}
      />
    </div>
  );
}
