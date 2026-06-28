import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportTemplateForm } from "@/components/report-templates/report-template-form";
import { PageHeader } from "@/components/layout/page-header";
import { createReportTemplateAction } from "@/lib/report-templates/actions";
import { canManageReportTemplates } from "@/lib/report-templates/guards";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Create report template",
};

export default async function NewReportTemplatePage() {
  await requireModuleAccess("reports");
  const session = await requireSession();

  if (!canManageReportTemplates(session)) {
    redirect("/reports/templates");
  }

  return (
    <>
      <PageHeader
        title="Create report template"
        description="Define reusable report content for your organization."
        action={
          <Link
            href="/reports/templates"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to templates
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <ReportTemplateForm
          action={createReportTemplateAction}
          submitLabel="Create template"
          pendingLabel="Creating…"
        />
      </div>
    </>
  );
}
