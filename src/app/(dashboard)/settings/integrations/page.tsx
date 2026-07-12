import type { Metadata } from "next";
import Link from "next/link";
import { IntegrationCenterWorkspace } from "@/components/settings/integration-center-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getIntegrationCenterSnapshot } from "@/lib/integrations/center/snapshot";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Integrations",
};

export default async function SettingsIntegrationsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();
  const canManage = canManageOrganizationSettings(session);

  if (!canManage) {
    return (
      <>
        <PageHeader
          module="settings"
          title="Integration Center"
          description="Operational status for AI, billing, messaging, and API integrations."
        />
        <PageSurface>
          <p className="text-sm text-muted">
            Only organization owners and admins can view the Integration Center.
          </p>
        </PageSurface>
      </>
    );
  }

  const snapshot = await getIntegrationCenterSnapshot(session);

  return (
    <>
      <PageHeader
        module="settings"
        title="Integration Center"
        description="Operational status for AI, billing, messaging, and API integrations."
      />
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className={linkText}>
          Workspace Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Integrations</span>
      </div>
      <IntegrationCenterWorkspace snapshot={snapshot} />
    </>
  );
}
