import type { Metadata } from "next";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { getPublicSelfServePlans } from "@/lib/billing/plans";
import { getBillingOverview } from "@/lib/billing/queries";
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
  const [overview, plans, seatUsage, clientUsage] = await Promise.all([
    getBillingOverview(session),
    Promise.resolve(getPublicSelfServePlans()),
    getOrganizationSeatUsageFromSession(session),
    getClientLimitUsageForSession(session),
  ]);
  const canManage = canManageOrganizationSettings(session);
  const stripeStatus = getStripeBillingUiStatus();
  const enterpriseContactHref = resolveEnterpriseContactHref(session.role);

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-1 py-2">
      <PricingHero />
      <PricingGrid
        plans={plans}
        selection={{
          currentPlanKey: overview.currentPlanKey,
          isActive: overview.isActive,
          canManage,
          usedSeats: seatUsage.used,
          usedClients: clientUsage.used,
        }}
        stripeStatus={stripeStatus}
        enterpriseContactHref={enterpriseContactHref}
      />
    </div>
  );
}
