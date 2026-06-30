import type { ReportVersion } from "@/lib/reports-v2/types";
import { REPORT_STATUS_V2_LABELS } from "@/lib/reports-v2/types";
import { formatReportDate } from "@/lib/reports/types";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableEmpty,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";

type ReportVersionHistoryProps = {
  versions: ReportVersion[];
};

export function ReportVersionHistory({ versions }: ReportVersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <AuroraTableEmpty
        title="No version history"
        description="Version history will appear after new report versions are created."
      />
    );
  }

  return (
    <AuroraDataTable>
      <AuroraTable>
        <AuroraTableHead>
          <tr>
            <AuroraTableHeaderCell>Version</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Published</AuroraTableHeaderCell>
            <AuroraTableHeaderCell>Updated</AuroraTableHeaderCell>
          </tr>
        </AuroraTableHead>
        <AuroraTableBody>
          {versions.map((version) => (
            <tr key={version.id} className="border-b border-border/70">
              <AuroraTableCell className="font-semibold">v{version.version}</AuroraTableCell>
              <AuroraTableCell>{REPORT_STATUS_V2_LABELS[version.status]}</AuroraTableCell>
              <AuroraTableCell className="text-muted">
                {formatReportDate(version.publishedAt)}
              </AuroraTableCell>
              <AuroraTableCell className="text-muted">
                {formatReportDate(version.updatedAt)}
              </AuroraTableCell>
            </tr>
          ))}
        </AuroraTableBody>
      </AuroraTable>
    </AuroraDataTable>
  );
}
