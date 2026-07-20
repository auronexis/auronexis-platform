import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailSettingsForm } from "@/components/settings/email-settings-form";
import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { PageHeader } from "@/components/layout/page-header";
import { getOrganizationEmailSettings } from "@/lib/email/organization-settings-queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { extractEmailAddress } from "@/lib/email/addresses";
import { getDefaultFromEmail } from "@/lib/env/email";

export const metadata: Metadata = {
  title: "Email settings",
};

export default async function EmailSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const settings = await getOrganizationEmailSettings(session);

  return (
    <PlanFeatureGate feature="email_delivery">
      <PageHeader
        title="Email settings"
        description="Configure the sender identity used for client report delivery."
      />
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-accent-blue hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Email</span>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <EmailSettingsForm
          settings={settings}
          organizationName={session.organization.name}
          defaultFromEmail={extractEmailAddress(getDefaultFromEmail())}
        />
      </div>
    </PlanFeatureGate>
  );
}

