import type { Metadata } from "next";
import Link from "next/link";
import { UsageDashboardPanel } from "@/components/settings/usage-dashboard-panel";
import { PageHeader } from "@/components/layout/page-header";
import { getUsageDashboardData } from "@/lib/billing/usage";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Usage",
};

export default async function UsageSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const data = await getUsageDashboardData(session);

  return (
    <>
      <PageHeader
        module="settings"
        title="Usage"
        description="Monitor AI, API, automation, connector, storage, and team consumption against plan quotas."
        action={
          <Link href="/settings/billing" className="text-sm font-medium text-accent-blue hover:underline">
            Back to billing
          </Link>
        }
      />

      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-accent-blue hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings/billing" className="font-medium text-accent-blue hover:underline">
          Billing
        </Link>
        <span className="mx-2">/</span>
        <span>Usage</span>
      </div>

      <UsageDashboardPanel data={data} />
    </>
  );
}
