import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ComplianceWorkspace } from "@/components/compliance/compliance-workspace";
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
          <Link href="/dashboard/compliance/audit" className="text-sm font-medium text-accent-blue hover:underline">
            Audit explorer
          </Link>
        }
      />
      <ComplianceWorkspace
        dashboard={dashboard}
        gdprRequests={gdprRequests}
        securityIncidents={securityIncidents}
        retentionRules={retentionRules}
      />
    </>
  );
}
