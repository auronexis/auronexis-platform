import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MollieTestCheckoutPanel } from "@/components/settings/mollie-test-checkout-panel";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import {
  getMollieTestDiagnostics,
  isMollieTestCheckoutConfigured,
} from "@/lib/billing/providers/mollie/checkout";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Mollie Test Checkout",
};

export default async function MollieTestCheckoutPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const configured = isMollieTestCheckoutConfigured();
  const initialDiagnostics = configured
    ? await getMollieTestDiagnostics(session.organization.id).catch(() => null)
    : null;

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
        <span>Mollie test</span>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Internal · TEST MODE"
        title="Mollie Test Checkout"
        description="Launch an isolated Mollie TEST subscription lifecycle (customer → first payment → mandate → subscription). Does not affect production billing."
      />

      <MollieTestCheckoutPanel configured={configured} initialDiagnostics={initialDiagnostics} />
    </>
  );
}
