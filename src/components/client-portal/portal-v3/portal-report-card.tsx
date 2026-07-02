import Link from "next/link";
import { PortalActionLink, PortalCard } from "@/components/client-portal/portal-ui";
import type { PortalReportListItem } from "@/lib/client-portal/types";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";

type PortalReportCardProps = {
  report: PortalReportListItem;
  showActions?: boolean;
};

export function PortalReportCard({ report, showActions = true }: PortalReportCardProps) {
  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/client-portal/reports/${report.id}`} className="text-lg font-semibold text-primary hover:underline">
            {report.title}
          </Link>
          <p className="mt-1 text-sm text-muted">
            {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
          </p>
          {report.summary ? (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground">{report.summary}</p>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm">
          <div>
            <span className="text-muted">Health:</span> {report.health_score ?? "—"}
          </div>
          <div>
            <span className="text-muted">SLA:</span>{" "}
            {report.sla_score != null ? `${report.sla_score}%` : "—"}
          </div>
          <div className="text-muted">
            Published {formatReportDate(report.published_at ?? report.sent_at)}
          </div>
        </div>
      </div>
      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <PortalActionLink href={`/client-portal/reports/${report.id}`} variant="secondary">
            View report
          </PortalActionLink>
          <PortalActionLink href={`/client-portal/reports/${report.id}/export`}>Download PDF</PortalActionLink>
        </div>
      ) : null}
    </PortalCard>
  );
}
