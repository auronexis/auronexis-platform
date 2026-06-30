import Link from "next/link";
import type { ReportsOverviewMetrics } from "@/lib/reports-v2/types";
import { formatReportDate } from "@/lib/reports/types";
import { linkText } from "@/lib/ui/tokens";

type DashboardReportsOverviewProps = {
  metrics: ReportsOverviewMetrics;
};

export function DashboardReportsOverview({ metrics }: DashboardReportsOverviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
        <p className="text-sm text-muted">Published this month</p>
        <p className="mt-2 text-2xl font-semibold">{metrics.publishedThisMonth}</p>
      </div>
      <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
        <p className="text-sm text-muted">Draft reports</p>
        <p className="mt-2 text-2xl font-semibold">{metrics.draftCount}</p>
      </div>
      <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
        <p className="text-sm text-muted">Avg health score</p>
        <p className="mt-2 text-2xl font-semibold">{metrics.averageHealthScore ?? "—"}</p>
      </div>
      <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
        <p className="text-sm text-muted">Avg SLA score</p>
        <p className="mt-2 text-2xl font-semibold">
          {metrics.averageSlaScore != null ? `${metrics.averageSlaScore}%` : "—"}
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-surface/60 p-4 sm:col-span-2 xl:col-span-2">
        <p className="text-sm text-muted">Latest published report</p>
        {metrics.latestReport ? (
          <div className="mt-2">
            <Link href={`/reports/${metrics.latestReport.id}`} className={linkText}>
              {metrics.latestReport.title}
            </Link>
            <p className="mt-1 text-xs text-muted">
              {formatReportDate(metrics.latestReport.published_at ?? metrics.latestReport.updated_at)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No published reports yet.</p>
        )}
      </div>
    </div>
  );
}
