import type { Metadata } from "next";
import Link from "next/link";
import { BillingSettingsPanel } from "@/components/settings/billing-settings-panel";
import { PageHeader } from "@/components/layout/page-header";
import { loadBillingSettingsPageModel } from "@/lib/billing/billing-page";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

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

export default async function BillingSettingsPage({ searchParams }: BillingSettingsPageProps) {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const params = await searchParams;
  const model = await loadBillingSettingsPageModel(session, params);

  return (
    <>
      <PageHeader
        module="settings"
        title="Subscription & Billing"
        description="Manage your plan, usage limits, invoices, and billing preferences."
      />

      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-accent-blue hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Billing</span>
      </div>

      <BillingSettingsPanel
        dashboard={model.dashboard}
        seatUsage={model.seatUsage}
        planUsage={model.planUsage}
        canManage={model.canManage}
        stripeStatus={model.stripeStatus}
        activeProvider={model.activeProvider}
        success={model.showLegacySuccessBanner}
        successMessage={model.showLegacySuccessBanner ? model.checkoutSuccessMessage : null}
        paddleCheckoutSuccess={model.pollCheckoutSuccess}
        paddleSyncStatus={model.paddleSyncStatus}
        cancelled={model.cancelled}
        billingContactCard={model.billingContactCard}
        enterpriseStatus={model.enterpriseStatus}
        enterpriseAutoOpen={model.enterpriseAutoOpen}
        locale={model.locale}
      />
    </>
  );
}
