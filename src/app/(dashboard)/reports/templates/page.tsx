import type { Metadata } from "next";
import Link from "next/link";
import { ReportTemplateList } from "@/components/report-templates/report-template-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { canManageReportTemplates } from "@/lib/report-templates/guards";
import { listReportTemplates } from "@/lib/report-templates/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Report templates",
};

export default async function ReportTemplatesPage() {
  await requireModuleAccess("reports");
  const session = await requireSession();
  const templates = await listReportTemplates(session);
  const canManage = canManageReportTemplates(session);

  return (
    <>
      <PageHeader
        module="reports"
        title="Report templates"
        description="Reusable report content for faster drafting and scheduled generation."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/reports" className="text-sm font-medium text-accent-blue hover:underline">
              Back to reports
            </Link>
            {canManage ? (
              <Link href="/reports/templates/new">
                <Button>Create template</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <ReportTemplateList templates={templates} canManage={canManage} />
    </>
  );
}
