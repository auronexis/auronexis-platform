import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { ClickableRow } from "@/components/ui/clickable-row";
import { RowInteractiveLink } from "@/components/ui/interactive-surface";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import { linkText } from "@/lib/ui/tokens";
import type { ReportWithRelations } from "@/lib/reports/types";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";

type ReportListProps = {
  reports: ReportWithRelations[];
};

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <AuroraTableEmpty
        title="No reports have been drafted"
        description="Create executive reports to demonstrate delivered value and operational outcomes to clients."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Report</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Client</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Period</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Assigned</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {reports.map((report) => (
            <ClickableRow
              key={report.id}
              href={`/reports/${report.id}`}
              ariaLabel={`Open report ${report.title}`}
            >
              <AuroraTableCell>
                <span className="font-semibold text-foreground">{report.title}</span>
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {report.clients?.name ? (
                  <RowInteractiveLink href={`/clients/${report.client_id}`} className={linkText}>
                    {report.clients.name}
                  </RowInteractiveLink>
                ) : (
                  "—"
                )}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap">
                <ReportStatusBadge status={report.status} />
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {report.users?.full_name ?? "—"}
              </AuroraTableCell>
              <AuroraTableCell className="whitespace-nowrap text-muted">
                {formatReportDate(report.updated_at)}
              </AuroraTableCell>
            </ClickableRow>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
