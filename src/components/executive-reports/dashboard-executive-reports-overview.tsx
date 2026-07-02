import Link from "next/link";
import type { ExecutiveReportDashboardMetrics } from "@/lib/executive-reports/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type DashboardExecutiveReportsOverviewProps = {
  metrics: ExecutiveReportDashboardMetrics;
};

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "green" | "blue" | "amber" | "slate";
}) {
  const toneStyles = {
    green: "border-success/20 bg-success/10 text-success",
    blue: "border-primary/20 bg-primary/10 text-primary",
    amber: "border-warning/20 bg-warning/10 text-warning",
    slate: "border-border bg-muted/10 text-foreground",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function DashboardExecutiveReportsOverview({
  metrics,
}: DashboardExecutiveReportsOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Generated this month" value={metrics.generatedThisMonth} tone="blue" />
        <MetricCard label="Published" value={metrics.published} tone="green" />
        <MetricCard
          label="Avg confidence"
          value={
            metrics.averageConfidence != null
              ? `${Math.round(metrics.averageConfidence * 100)}%`
              : "—"
          }
          tone="amber"
        />
        <MetricCard
          label="Avg health"
          value={metrics.averageHealth ?? "—"}
        />
        <MetricCard
          label="Avg compliance"
          value={metrics.averageCompliance != null ? `${metrics.averageCompliance}%` : "—"}
          tone="slate"
        />
      </div>
      <Link href="/reports" className={linkText}>
        View reports
      </Link>
    </div>
  );
}
