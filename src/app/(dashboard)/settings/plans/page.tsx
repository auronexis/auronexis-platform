import type { Metadata } from "next";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { FormAlert } from "@/components/ui/form-alert";
import { getPublicSelfServePlans, type PlanKey } from "@/lib/billing/plans";
import { loadWorkspacePlansPageModel } from "@/lib/billing/plans-page";
import { requireSession } from "@/lib/auth/session";
import { resolveRequestBillingCountry } from "@/lib/fastspring/country";
import { getPublicLocalizedPrices } from "@/lib/fastspring/localized-pricing";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  description: "Compare Professional, Business, and Enterprise plans for your agency.",
};

export default async function WorkspacePlansPage() {
  await requireModuleAccess("pricing");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);
  const [model, country] = await Promise.all([
    loadWorkspacePlansPageModel(session, canManage, session.role),
    resolveRequestBillingCountry(),
  ]);
  const localizedPrices = await getPublicLocalizedPrices({ country });
  const localizedDisplayPrices = Object.fromEntries(
    localizedPrices.map((price) => [price.productPath as PlanKey, price.formattedAmount]),
  ) as Partial<Record<PlanKey, string>>;

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-1 py-2">
      <PricingHero />
      {model.sandboxCheckoutNotice ? (
        <FormAlert variant="warning">{model.sandboxCheckoutNotice}</FormAlert>
      ) : null}
      <PricingGrid
        plans={getPublicSelfServePlans()}
        selection={model.selection}
        stripeStatus={model.billingUiStatus}
        enterpriseContactHref={model.enterpriseContactHref}
        checkoutBlock={model.billingState.checkoutBlock}
        canManage={model.canManage}
        showPortalAction={model.showPortalAction}
        localizedDisplayPrices={localizedDisplayPrices}
      />
    </div>
  );
}
