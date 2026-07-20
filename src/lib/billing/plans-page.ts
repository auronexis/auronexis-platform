import "server-only";

import { getPlansPageBillingState, type PlansPageBillingState } from "@/lib/billing/queries";
import { getBillingUiStatus } from "@/lib/billing/ui-status";
import { resolveEnterpriseContactHref } from "@/lib/billing/enterprise-contact";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { hasVerifiedPaddleCustomer } from "@/lib/billing/active-billing";
import {
  FALLBACK_BILLING_UI_STATUS,
  normalizeBillingUiStatus,
} from "@/lib/billing/ui-status-client";
import type { BillingUiStatus } from "@/lib/billing/types";
import { getPaddleEnvironment, isPaddleConfigured } from "@/lib/paddle/env";
import { getClientLimitUsageForSession } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import {
  buildPricingSelectionContext,
  type PricingSelectionContext,
} from "@/lib/pricing/selection-context";
import type { SessionContext } from "@/lib/tenancy/context";
import type { UserRole } from "@/types/database";

export type WorkspacePlansPageModel = {
  billingState: PlansPageBillingState;
  selection: PricingSelectionContext;
  billingUiStatus: BillingUiStatus;
  enterpriseContactHref: string;
  sandboxCheckoutNotice: string | null;
  canManage: boolean;
  showPortalAction: boolean;
};

function resolveActiveProviderSafe(): "stripe" | "paddle" {
  try {
    return getActiveBillingProvider();
  } catch {
    return "paddle";
  }
}

/** Load all data for /settings/plans — fail-closed fallbacks, no business logic in the page. */
export async function loadWorkspacePlansPageModel(
  session: SessionContext,
  canManage: boolean,
  role: UserRole,
): Promise<WorkspacePlansPageModel> {
  let sandboxCheckoutNotice: string | null = null;
  try {
    if (resolveActiveProviderSafe() === "paddle" && isPaddleConfigured()) {
      if (getPaddleEnvironment() === "sandbox") {
        sandboxCheckoutNotice =
          "Sandbox checkout is active for billing tests. This is not a live production payment flow.";
      }
    }
  } catch {
    sandboxCheckoutNotice = null;
  }

  let billingUiStatus = FALLBACK_BILLING_UI_STATUS;
  try {
    billingUiStatus = normalizeBillingUiStatus(getBillingUiStatus());
  } catch (error) {
    console.warn("[plans] billing UI status unavailable — using fallback flags", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const [billingState, seatUsage, clientUsage] = await Promise.all([
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

  const activeProvider = resolveActiveProviderSafe();
  const showPortalAction =
    activeProvider === "paddle"
      ? hasVerifiedPaddleCustomer(billingState.overview.subscription)
      : true;

  return {
    billingState,
    selection,
    billingUiStatus,
    enterpriseContactHref: resolveEnterpriseContactHref(role),
    sandboxCheckoutNotice,
    canManage,
    showPortalAction,
  };
}
