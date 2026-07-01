import type { SlaComplianceMetrics, SlaDashboardMetrics } from "@/lib/sla/types";
import { formatSlaMinutes } from "@/lib/sla/summary";
import { cn } from "@/lib/utils/cn";

type SLAMetricsProps = {
  metrics: SlaComplianceMetrics | SlaDashboardMetrics;
  className?: string;
};

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneStyles = {
    neutral: "border-border bg-surface/40 text-foreground",
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    danger: "border-danger/20 bg-danger/10 text-danger",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function SLAMetrics({ metrics, className }: SLAMetricsProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      <MetricCard label="Compliance" value={`${metrics.compliancePercent}%`} tone="success" />
      <MetricCard
        label="Breached SLAs"
        value={String(metrics.breachedCount)}
        tone={metrics.breachedCount > 0 ? "danger" : "neutral"}
      />
      <MetricCard label="Avg response" value={formatSlaMinutes(metrics.avgResponseMinutes)} />
      <MetricCard label="Avg resolution" value={formatSlaMinutes(metrics.avgResolutionMinutes)} />
      <MetricCard
        label="Critical breaches"
        value={String(metrics.criticalBreaches)}
        tone={metrics.criticalBreaches > 0 ? "danger" : "neutral"}
      />
      <MetricCard label="Open timers" value={String(metrics.openTimers)} tone="warning" />
    </div>
  );
}
