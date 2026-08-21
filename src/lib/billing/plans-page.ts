import "server-only";

import { getPlansPageBillingState, type PlansPageBillingState } from "@/lib/billing/queries";
import { getBillingUiStatus } from "@/lib/billing/ui-status";
import { resolveEnterpriseContactHref } from "@/lib/billing/enterprise-contact";
import { getOrganizationBillingProvider } from "@/lib/billing/provider-selection";
import type { BillingProvider } from "@/lib/billing/provider-types";
import {
  FALLBACK_BILLING_UI_STATUS,
  normalizeBillingUiStatus,
} from "@/lib/billing/ui-status-client";
import type { BillingUiStatus } from "@/lib/billing/types";
import { getClientLimitUsageForSession } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import {
  buildPricingSelectionContext,
  type PricingSelectionContext,
} from "@/lib/pricing/selection-context";
import type { SessionContext } from "@/lib/tenancy/context";
import type { UserRole } from "@/types/database";
import { getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";

export type WorkspacePlansPageModel = {
  billingState: PlansPageBillingState;
  selection: PricingSelectionContext;
  billingUiStatus: BillingUiStatus;
  enterpriseContactHref: string;
  sandboxCheckoutNotice: string | null;
  canManage: boolean;
  showPortalAction: boolean;
};

function resolveOrgProviderSafe(
  organizationId: string,
  subscription: PlansPageBillingState["overview"]["subscription"],
): BillingProvider {
  try {
    return getOrganizationBillingProvider({ organizationId, subscription });
  } catch {
    return "fastspring";
  }
}

/** Load all data for /settings/plans — fail-closed fallbacks, no business logic in the page. */
export async function loadWorkspacePlansPageModel(
  session: SessionContext,
  canManage: boolean,
  role: UserRole,
): Promise<WorkspacePlansPageModel> {
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

  const orgProvider = resolveOrgProviderSafe(
    session.organization.id,
    billingState.overview.subscription,
  );

  let sandboxCheckoutNotice: string | null = null;
  try {
    if (orgProvider === "fastspring") {
      const storefront = process.env.FASTSPRING_STOREFRONT?.trim() ?? "";
      if (storefront.includes(".test.onfastspring.com/")) {
        sandboxCheckoutNotice =
          "FastSpring TEST storefront is configured. Purchases use test mode — not live production charges.";
      }
    } else if (orgProvider === "mollie" && getMollieCredentialMode() === "test") {
      sandboxCheckoutNotice =
        "Mollie TEST credentials are configured for this workspace. Purchases use test mode — not live production charges.";
    }
  } catch {
    sandboxCheckoutNotice = null;
  }

  let billingUiStatus = FALLBACK_BILLING_UI_STATUS;
  try {
    billingUiStatus = normalizeBillingUiStatus(
      getBillingUiStatus({
        organizationId: session.organization.id,
        organizationProvider: orgProvider,
      }),
    );
  } catch (error) {
    console.warn("[plans] billing UI status unavailable — using fallback flags", {
      message: error instanceof Error ? error.message : String(error),
    });
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
    billingProvider: orgProvider,
    pendingPlanKey: billingState.overview.subscription?.pending_plan ?? null,
    pendingPlanEffectiveAt:
      billingState.overview.subscription?.pending_plan_effective_at ?? null,
    pendingPlanChangeType:
      billingState.overview.subscription?.pending_plan_change_type ?? null,
  });

  // Neither FastSpring nor Mollie expose a hosted customer portal in this integration.
  const showPortalAction = false;

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
