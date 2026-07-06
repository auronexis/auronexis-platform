import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingDiagnosticsPanel } from "@/components/settings/billing-diagnostics-panel";
import { PageHeader } from "@/components/layout/page-header";
import { getBillingProductionDiagnostics } from "@/lib/billing/production-diagnostics";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Billing Diagnostics",
};

export default async function BillingDiagnosticsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const diagnostics = await getBillingProductionDiagnostics(session);

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-primary hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings/billing" className="font-medium text-primary hover:underline">
          Billing
        </Link>
        <span className="mx-2">/</span>
        <span>Billing diagnostics</span>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Internal"
        title="Billing diagnostics"
        description="Inspect subscription rows, invoices, webhook processing, and billing sanity checks for this workspace."
      />

      <BillingDiagnosticsPanel data={diagnostics} />
    </>
  );
}
