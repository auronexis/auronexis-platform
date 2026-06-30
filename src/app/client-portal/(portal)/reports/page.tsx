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
        description="Review and download operational reports shared with your organization."
      />

      {reports.length === 0 ? (
        <PortalEmptyState
          title="No reports available"
          description="Your agency will share reports here once they are sent."
        />
      ) : (
        <PortalTableShell>
          <table className="min-w-full divide-y divide-border-subtle">
            <thead>
              <tr>
                <th className={portalTableHeadClass}>Report</th>
                <th className={portalTableHeadClass}>Reporting period</th>
                <th className={portalTableHeadClass}>Status</th>
                <th className={portalTableHeadClass}>Generated</th>
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
                    {report.title}
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>
                    {formatReportPeriod(
                      report.reporting_period_start,
                      report.reporting_period_end,
                    )}
                  </td>
                  <td className={portalTableCellClass}>
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                      {report.status}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap ${portalTableCellClass} text-muted`}>
                    {formatReportDate(report.sent_at)}
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
