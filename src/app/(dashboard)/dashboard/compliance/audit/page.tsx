import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuditExplorer } from "@/components/compliance/audit-explorer";
import { PageHeader } from "@/components/layout/page-header";
import { listAuditTimeline } from "@/lib/compliance/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";

export const metadata: Metadata = {
  title: "Audit Explorer",
};

export default async function ComplianceAuditPage() {
  await requireModuleAccess("dashboard");
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    redirect("/dashboard");
  }

  const initialResult = await listAuditTimeline(session, { page: 1, pageSize: 50 });

  return (
    <>
      <PageHeader
        module="dashboard"
        title="Audit Explorer"
        description="Search, filter, and export immutable audit events with activity history mapping."
        action={
          <Link href="/dashboard/compliance" className="text-sm font-medium text-accent-blue hover:underline">
            Back to compliance
          </Link>
        }
      />
      <AuditExplorer initialResult={initialResult} />
    </>
  );
}
