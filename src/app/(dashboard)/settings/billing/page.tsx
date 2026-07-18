import type { Metadata } from "next";
import Link from "next/link";
import { BillingSettingsPanel } from "@/components/settings/billing-settings-panel";
import { PageHeader } from "@/components/layout/page-header";
import {
  SUPPORT_CONTACT_CARD,
} from "@/lib/billing/billing-contact";
import { getPaddleCheckoutSyncStatus } from "@/lib/billing/checkout-sync-status";
import { getBillingDashboardData } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { getBillingUiStatusWithPortalFeatures } from "@/lib/billing/ui-status";
import { resolveLocaleFromOrganization } from "@/lib/i18n";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { getOrganizationPlanUsageSummary } from "@/lib/plans/queries";
import { getOrganizationSeatUsageFromSession } from "@/lib/seats/queries";
import { getEnterpriseStatus } from "@/lib/enterprise/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  isPaddleCheckoutSuccessParam,
  PADDLE_CHECKOUT_SUCCESS_MESSAGE,
} from "@/lib/paddle/checkout-success";

export const metadata: Metadata = {
  title: "Billing",
};

type BillingSettingsPageProps = {
  searchParams: Promise<{
    success?: string;
    checkout?: string;
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
  const activeProvider = getActiveBillingProvider();
  const stripeStatus = await getBillingUiStatusWithPortalFeatures();
  const paddleCheckoutSuccess = isPaddleCheckoutSuccessParam(params.checkout);

  let checkoutSuccessMessage: string | null = null;
  let showLegacySuccessBanner = false;

  if (paddleCheckoutSuccess) {
    checkoutSuccessMessage = PADDLE_CHECKOUT_SUCCESS_MESSAGE;
  } else if (params.success === "1" && canManage) {
    // Prefer canonical ?checkout=success for Paddle; tolerate legacy success=1.
    checkoutSuccessMessage = PADDLE_CHECKOUT_SUCCESS_MESSAGE;
    showLegacySuccessBanner = false;
  } else if (params.success === "1") {
    checkoutSuccessMessage = "Payment received. Your plan may update shortly.";
    showLegacySuccessBanner = true;
  }

  const [dashboard, seatUsage, enterpriseStatus, paddleSyncStatus] = await Promise.all([
    getBillingDashboardData(session),
    getOrganizationSeatUsageFromSession(session),
    getEnterpriseStatus(session.organization.id),
    getPaddleCheckoutSyncStatus(session),
  ]);
  const planUsage = await getOrganizationPlanUsageSummary(
    session,
    seatUsage.used,
    seatUsage.limit,
  );

  const locale = resolveLocaleFromOrganization(session.organization);
  const pollCheckoutSuccess = paddleCheckoutSuccess || params.success === "1";

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
        activeProvider={activeProvider}
        success={showLegacySuccessBanner}
        successMessage={showLegacySuccessBanner ? checkoutSuccessMessage : null}
        paddleCheckoutSuccess={pollCheckoutSuccess}
        paddleSyncStatus={paddleSyncStatus}
        cancelled={params.cancelled === "1"}
        billingContactCard={resolveBillingContactCard(params.contact === "support" ? "support" : undefined)}
        enterpriseStatus={enterpriseStatus}
        enterpriseAutoOpen={params.contact === "enterprise"}
        locale={locale}
      />
    </>
  );
}
