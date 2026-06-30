import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportScheduleForm } from "@/components/report-schedules/report-schedule-form";
import { PageHeader } from "@/components/layout/page-header";
import { listClients } from "@/lib/clients/queries";
import { createReportScheduleAction } from "@/lib/report-schedules/actions";
import { canManageReportSchedules } from "@/lib/report-schedules/guards";
import { listReportTemplateOptions } from "@/lib/report-templates/queries";
import { listOrgUsers } from "@/lib/risks/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Create report schedule",
};

export default async function NewReportSchedulePage() {
  await requireModuleAccess("reports");
  const session = await requireSession();

  if (!canManageReportSchedules(session)) {
    redirect("/reports/schedules");
  }

  const [clients, orgUsers, templates] = await Promise.all([
    listClients(session),
    listOrgUsers(session),
    listReportTemplateOptions(session),
  ]);

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Create report schedule"
          description="Set up a recurring report cadence for a client."
          action={
            <Link
              href="/reports/schedules"
              className="text-sm font-medium text-accent-blue hover:underline"
            >
              Back to schedules
            </Link>
          }
        />
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-12 text-center">
          <p className="text-lg font-medium text-foreground">Add a client first</p>
          <p className="mt-2 text-sm text-muted">
            Report schedules must be linked to an existing client record.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Create report schedule"
        description="Set up a recurring report cadence for a client."
        action={
          <Link
            href="/reports/schedules"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Back to schedules
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <ReportScheduleForm
          action={createReportScheduleAction}
          clients={clients}
          orgUsers={orgUsers}
          templates={templates}
          submitLabel="Create schedule"
          pendingLabel="Creating…"
        />
      </div>
    </>
  );
}
