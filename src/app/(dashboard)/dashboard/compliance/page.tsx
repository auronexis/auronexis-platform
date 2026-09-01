import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ComplianceWorkspaceLazy } from "@/components/performance/lazy-workspaces";
import { PageHeader } from "@/components/layout/page-header";
import { getComplianceWorkspaceData } from "@/lib/compliance/repository";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Compliance",
};

export default async function ComplianceDashboardPage() {
  await requireModuleAccess("dashboard");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const { dashboard, gdprRequests, securityIncidents, retentionRules } =
    await getComplianceWorkspaceData(session);

  return (
    <>
      <PageHeader
        module="dashboard"
        title="Compliance & Governance"
        description="Audit readiness, GDPR requests, retention policies, security incidents, and evidence exports for enterprise procurement."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/compliance/einvoice-archive" className="text-sm font-medium text-accent-blue hover:underline">
              E-Invoice Archive
            </Link>
            <Link href="/dashboard/compliance/audit" className="text-sm font-medium text-accent-blue hover:underline">
              Audit explorer
            </Link>
          </div>
        }
      />
      <ComplianceWorkspaceLazy
        dashboard={dashboard}
        gdprRequests={gdprRequests}
        securityIncidents={securityIncidents}
        retentionRules={retentionRules}
      />
    </>
  );
}
