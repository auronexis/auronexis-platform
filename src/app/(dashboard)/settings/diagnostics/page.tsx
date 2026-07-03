import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DiagnosticsPanel } from "@/components/settings/diagnostics-panel";
import { RefreshDiagnosticsButton } from "@/components/settings/refresh-diagnostics-button";
import { PageHeader } from "@/components/layout/page-header";
import { getWorkspaceDiagnostics } from "@/lib/diagnostics/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Diagnostics",
};

export default async function DiagnosticsSettingsPage() {
  await requireModuleAccess("settings");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const diagnostics = await getWorkspaceDiagnostics(session);

  return (
    <>
      <div className="mb-4 text-sm text-muted">
        <Link href="/settings" className="font-medium text-primary hover:underline">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span>Diagnostics</span>
      </div>

      <PageHeader
        module="settings"
        eyebrow="Workspace Diagnostics"
        title="Diagnostics"
        description="Inspect organization, billing, plan enforcement, AI, and environment readiness."
        action={<RefreshDiagnosticsButton />}
      />

      <DiagnosticsPanel data={diagnostics} />
    </>
  );
}
