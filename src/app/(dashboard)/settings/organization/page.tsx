import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrganizationForm } from "@/components/settings/organization-form";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import {
  getStoredOrganizationCurrency,
  getStoredOrganizationLanguage,
  getStoredOrganizationRegionalSettings,
} from "@/lib/i18n";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Organization",
};

export default async function OrganizationSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const organizationLanguage = getStoredOrganizationLanguage(session.organization);
  const organizationCurrency = getStoredOrganizationCurrency(session.organization);
  const regional = getStoredOrganizationRegionalSettings(session.organization);

  return (
    <>
      <PageHeader
        module="settings"
        title="Organization"
        description="Update your agency profile and workspace regional settings."
      />
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className={linkText}>
          Workspace Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Organization</span>
      </div>

      <PageSurface>
        <OrganizationForm
          organizationName={session.organization.name}
          organizationLanguage={organizationLanguage}
          organizationCurrency={organizationCurrency}
          organizationTimezone={regional.timezone}
          organizationDateFormat={regional.dateFormat}
          organizationTimeFormat={regional.timeFormat}
          organizationWeekStart={regional.weekStart}
          organizationMeasurementSystem={regional.measurementSystem}
        />
      </PageSurface>
    </>
  );
}
