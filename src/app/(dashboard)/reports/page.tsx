import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { ReportList } from "@/components/reports/report-list";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { canCreateReport } from "@/lib/reports/guards";
import { listReports } from "@/lib/reports/queries";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Reports",
};

type ReportsPageProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireSession();

  if (!sessionHasPermission(session, "reports.read")) {
    return (
      <>
        <PageHeader
          module="reports"
          title="Reports"
          description="Demonstrate delivered value and operational outcomes to clients."
        />
        <AccessDenied />
      </>
    );
  }

  const params = await searchParams;
  const includeArchived = params.archived === "1";
  const reports = await listReports(session, { includeArchived });

  const canCreate = canCreateReport(session);

  return (
    <>
      <PageHeader
        module="reports"
        title="Reports"
        description="Demonstrate delivered value and operational outcomes to clients."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/reports/templates">
              <Button variant="secondary">Templates</Button>
            </Link>
            <Link href="/reports/schedules">
              <Button variant="secondary">Schedules</Button>
            </Link>
            {canCreate ? (
              <LinkButton href="/reports/new">Create report</LinkButton>
            ) : (
              <span className="text-sm text-muted">
                Create report unavailable — your role cannot create reports.
              </span>
            )}
          </div>
        }
      />

      <ArchiveFilterTabs
        tabs={[
          { label: "Active reports", href: "/reports", active: !includeArchived },
          { label: "Include archived", href: "/reports?archived=1", active: includeArchived },
        ]}
      />

      <ReportList reports={reports} />
    </>
  );
}
