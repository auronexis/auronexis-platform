import type { Metadata } from "next";
import Link from "next/link";
import { BillingSettingsPanel } from "@/components/settings/billing-settings-panel";
import { PageHeader } from "@/components/layout/page-header";
import {
  SUPPORT_CONTACT_CARD,
} from "@/lib/billing/billing-contact";
import { getBillingDashboardData } from "@/lib/billing/queries";
import { getStripeBillingUiStatusWithPortalFeatures } from "@/lib/billing/stripe-config";
import { syncCheckoutSessionForOrganization } from "@/lib/stripe/checkout-sync";
import { resolveLocaleFromOrganization } from "@/lib/i18n";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getOrganizationPlanUsageSummary } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import { getEnterpriseStatus } from "@/lib/enterprise/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Billing",
};

type BillingSettingsPageProps = {
  searchParams: Promise<{
    success?: string;
    cancelled?: string;
    session_id?: string;
    contact?: string;
  }>;
};

function resolveBillingContactCard(contact?: string) {
  if (contact === "support") {
    return SUPPORT_CONTACT_CARD;
  }

  return null;
}

export default async function BillingSettingsPage({ searchParams }: BillingSettingsPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);
  const params = await searchParams;
  const stripeStatus = await getStripeBillingUiStatusWithPortalFeatures();

  let checkoutSuccessMessage: string | null = null;

  if (params.success === "1" && canManage) {
    const syncResult = await syncCheckoutSessionForOrganization(
      session.organization.id,
      params.session_id ?? null,
    );
    checkoutSuccessMessage = syncResult.message;
  } else if (params.success === "1") {
    checkoutSuccessMessage = "Payment received. Your plan may update shortly.";
  }

  const [dashboard, seatUsage, enterpriseStatus] = await Promise.all([
    getBillingDashboardData(session),
    getOrganizationSeatUsageFromSession(session),
    getEnterpriseStatus(session.organization.id),
  ]);
  const planUsage = await getOrganizationPlanUsageSummary(
    session,
    seatUsage.used,
    seatUsage.limit,
  );

  const locale = resolveLocaleFromOrganization(session.organization);

  return (
    <>
      <PageHeader
        module="settings"
        title="Subscription & Billing"
        description="Manage your plan, usage limits, invoices, promotions, and billing preferences."
      />

      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-accent-blue hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Billing</span>
      </div>

      <BillingSettingsPanel
        dashboard={dashboard}
        seatUsage={seatUsage}
        planUsage={planUsage}
        canManage={canManage}
        stripeStatus={stripeStatus}
        success={params.success === "1"}
        successMessage={checkoutSuccessMessage}
        cancelled={params.cancelled === "1"}
        billingContactCard={resolveBillingContactCard(params.contact === "support" ? "support" : undefined)}
        enterpriseStatus={enterpriseStatus}
        enterpriseAutoOpen={params.contact === "enterprise"}
        locale={locale}
      />
    </>
  );
}
