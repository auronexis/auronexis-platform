import type { Metadata } from "next";
import {
  PortalActionLink,
  PortalEmptyState,
  PortalPageHeader,
  PortalTableShell,
  portalTableCellClass,
  portalTableHeadClass,
} from "@/components/client-portal/portal-ui";
import { ClickableRow } from "@/components/ui/clickable-row";
import { rowInteractiveClass } from "@/components/ui/interactive-surface";
import { listPortalReports } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Portal Reports",
};

export default async function ClientPortalReportsPage() {
  const session = await requireClientPortalSession();
  const reports = await listPortalReports(session);

  return (
    <>
      <PortalPageHeader
        title="Report Center"
        description="Review published operational reports shared with your organization."
      />

      {reports.length === 0 ? (
        <PortalEmptyState
          title="No reports available"
          description="Your agency will share reports here once they are published."
        />
      ) : (
        <PortalTableShell>
          <table className="min-w-full divide-y divide-border-subtle">
            <thead>
              <tr>
                <th className={portalTableHeadClass}>Report</th>
                <th className={portalTableHeadClass}>Period</th>
                <th className={portalTableHeadClass}>Health</th>
                <th className={portalTableHeadClass}>SLA</th>
                <th className={portalTableHeadClass}>Published</th>
                <th className={`${portalTableHeadClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {reports.map((report) => (
                <ClickableRow
                  key={report.id}
                  href={`/client-portal/reports/${report.id}`}
                  ariaLabel={`Open report ${report.title}`}
                >
                  <td className={`font-semibold text-foreground ${portalTableCellClass}`}>
                    <p>{report.title}</p>
                    {report.summary ? (
                      <p className="mt-1 line-clamp-2 text-xs font-normal text-muted">
                        {report.summary}
                      </p>
                    ) : null}
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>
                    {formatReportPeriod(
                      report.reporting_period_start,
                      report.reporting_period_end,
                    )}
                  </td>
                  <td className={portalTableCellClass}>
                    {report.health_score ?? "—"}
                  </td>
                  <td className={portalTableCellClass}>
                    {report.sla_score != null ? `${report.sla_score}%` : "—"}
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass} text-muted`}>
                    {formatReportDate(report.published_at ?? report.sent_at)}
                  </td>
                  <td className={`${portalTableCellClass} text-right`}>
                    <div
                      className={cn(rowInteractiveClass, "flex flex-wrap justify-end gap-2")}
                      data-row-interactive
                    >
                      <PortalActionLink
                        href={`/client-portal/reports/${report.id}`}
                        variant="secondary"
                      >
                        View
                      </PortalActionLink>
                      <PortalActionLink href={`/client-portal/reports/${report.id}/export`}>
                        Download
                      </PortalActionLink>
                    </div>
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </PortalTableShell>
      )}
    </>
  );
}
