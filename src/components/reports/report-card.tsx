import Link from "next/link";
import type { ReportV2View } from "@/lib/reports-v2/types";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";
import { cn } from "@/lib/utils/cn";

type ReportCardProps = {
  report: ReportV2View;
  className?: string;
};

export function ReportCard({ report, className }: ReportCardProps) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className={cn(
        "block rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-sm transition hover:border-primary/25 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{report.title}</p>
          <p className="mt-1 text-sm text-muted">
            {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
          </p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span>v{report.version}</span>
        {report.health_score != null ? <span>Health {report.health_score}</span> : null}
        {report.sla_score != null ? <span>SLA {report.sla_score}%</span> : null}
        <span>{formatReportDate(report.published_at ?? report.updated_at)}</span>
      </div>
    </Link>
  );
}
