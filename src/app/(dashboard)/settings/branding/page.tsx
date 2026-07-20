import type { Metadata } from "next";
import Link from "next/link";
import { WhiteLabelWorkspaceLazy } from "@/components/performance/lazy-workspaces";
import { PlanFeatureGate } from "@/components/plans/plan-feature-gate";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  getResolvedWhiteLabelBranding,
  getWhiteLabelSettingsView,
} from "@/lib/white-label/queries";

export const metadata: Metadata = {
  title: "White Label Branding",
};

export default async function BrandingSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);
  const [settings, previewBranding] = await Promise.all([
    getWhiteLabelSettingsView(session.organization.id),
    getResolvedWhiteLabelBranding(session),
  ]);

  return (
    <PlanFeatureGate feature="white_label">
      <PageHeader
        title="White Label Branding"
        description="Rebrand the dashboard, login, client portal, emails, and PDF exports without changing application code."
        action={
          <Link href="/settings" className="text-sm font-medium text-accent-blue hover:underline">
            Back to settings
          </Link>
        }
      />
      <PageSurface>
        <WhiteLabelWorkspaceLazy
          settings={settings}
          previewBranding={previewBranding}
          canManage={canManage}
          organizationName={session.organization.name}
        />
      </PageSurface>
    </PlanFeatureGate>
  );
}
