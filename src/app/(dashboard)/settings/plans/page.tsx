import type { Metadata } from "next";
import { PricingGrid, buildPricingSelectionContext } from "@/components/pricing/pricing-grid";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { getPublicSelfServePlans } from "@/lib/billing/plans";
import { getPlansPageBillingState } from "@/lib/billing/queries";
import { buildBillingOverview } from "@/lib/billing/types";
import { getStripeBillingUiStatus } from "@/lib/billing/stripe-config";
import { resolveEnterpriseContactHref } from "@/lib/billing/enterprise-contact";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getClientLimitUsageForSession } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description: "Compare Professional, Business, and Enterprise plans for your agency.",
};

export default async function WorkspacePlansPage() {
  await requireModuleAccess("pricing");
  const session = await requireSession();

  let billingState;
  let seatUsage = { used: 0 };
  let clientUsage = { used: 0 };

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
      overview: buildBillingOverview(null, session.organization.plan, null, null),
      invoices: [],
      resolvedPlanKey: null,
      currentPlanKey: null,
      currentPlan: null,
      currentPlanName: null,
    };
  }

  const canManage = canManageOrganizationSettings(session);
  const stripeStatus = getStripeBillingUiStatus();
  const enterpriseContactHref = resolveEnterpriseContactHref(session.role);
  const selection = buildPricingSelectionContext({
    overview: billingState.overview,
    invoices: billingState.invoices,
    canManage,
    usedSeats: seatUsage.used,
    usedClients: clientUsage.used,
    currentPlanKey: billingState.currentPlanKey,
    currentPlan: billingState.currentPlan,
    currentPlanName: billingState.currentPlanName,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-1 py-2">
      <PricingHero />
      <PricingGrid
        plans={getPublicSelfServePlans()}
        selection={selection}
        stripeStatus={stripeStatus}
        enterpriseContactHref={enterpriseContactHref}
      />
    </div>
  );
}
