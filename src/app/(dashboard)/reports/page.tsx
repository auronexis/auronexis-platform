import type { Metadata } from "next";
import Link from "next/link";
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { ReportCard } from "@/components/reports/report-card";
import { ReportEmptyState } from "@/components/reports/report-empty-state";
import { ReportVersionHistory } from "@/components/reports/report-version-history";
import { PageHeader } from "@/components/layout/page-header";
import { ArchiveFilterTabs } from "@/components/ui/archive-filter-tabs";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { canCreateReport } from "@/lib/reports/guards";
import { listReportsV2 } from "@/lib/reports-v2/queries";
import { requireSession } from "@/lib/auth/session";
import type { ReportStatusV2 } from "@/lib/reports-v2/types";

export const metadata: Metadata = {
  title: "Reports",
};

type ReportsPageProps = {
  searchParams: Promise<{ tab?: string }>;
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
  const tab = params.tab ?? "draft";
  const statusMap: Record<string, ReportStatusV2 | ReportStatusV2[]> = {
    draft: "draft",
    published: "published",
    archived: "archived",
    generated: "generated",
  };
  const statusFilter = statusMap[tab] ?? "draft";

  const { data: reports } = await listReportsV2(session, {
    status: tab === "draft" ? ["draft", "generated"] : statusFilter,
  });
  const reportList = reports ?? [];

  const canCreate = canCreateReport(session);

  return (
    <>
      <PageHeader
        module="reports"
        title="Reports"
        description="Generate, publish, and version client-facing operational reports."
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
          { label: "Draft", href: "/reports?tab=draft", active: tab === "draft" },
          { label: "Published", href: "/reports?tab=published", active: tab === "published" },
          { label: "Archived", href: "/reports?tab=archived", active: tab === "archived" },
        ]}
      />

      {reportList.length === 0 ? (
        <ReportEmptyState
          title={`No ${tab} reports`}
          description="Create a report or switch tabs to view other report states."
          action={
            canCreate ? (
              <LinkButton href="/reports/new">Create report</LinkButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportList.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Version history</h2>
        <p className="mb-4 text-sm text-muted">
          Open a report detail page to view the full version history for that report series.
        </p>
        <ReportVersionHistory versions={[]} />
      </section>
    </>
  );
}
