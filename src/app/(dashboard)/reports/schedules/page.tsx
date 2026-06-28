import type { Metadata } from "next";
import Link from "next/link";
import { ReportScheduleList } from "@/components/report-schedules/report-schedule-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { canManageReportSchedules } from "@/lib/report-schedules/guards";
import { listReportSchedules } from "@/lib/report-schedules/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Report schedules",
};

export default async function ReportSchedulesPage() {
  await requireModuleAccess("reports");
  const session = await requireSession();
  const schedules = await listReportSchedules(session);
  const canManage = canManageReportSchedules(session);

  return (
    <>
      <PageHeader
        module="reports"
        title="Report schedules"
        description="Define recurring report cadences and generate drafts on demand."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/reports" className="text-sm font-medium text-accent-blue hover:underline">
              Back to reports
            </Link>
            {canManage ? (
              <Link href="/reports/schedules/new">
                <Button>Create schedule</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <ReportScheduleList schedules={schedules} />
    </>
  );
}
