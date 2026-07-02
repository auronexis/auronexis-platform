import type { MonitoringDashboardMetrics } from "@/lib/monitoring/types";
import { formatMonitoringTimestamp } from "@/lib/monitoring/types";
import { cn } from "@/lib/utils/cn";

type MonitoringMetricsProps = {
  metrics: MonitoringDashboardMetrics | {
    activeConnectors: number;
    failedConnectors: number;
    eventsToday: number;
    criticalEvents: number;
    lastCheckAt: string | null;
    connectorHealthPercent: number;
  };
};

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  tone?: "green" | "red" | "amber" | "slate" | "blue";
}) {
  const toneStyles = {
    green: "border-success/20 bg-success/10 text-success",
    red: "border-danger/20 bg-danger/10 text-danger",
    amber: "border-warning/20 bg-warning/10 text-warning",
    slate: "border-border bg-muted/10 text-foreground",
    blue: "border-primary/20 bg-primary/10 text-primary",
  } as const;

  return (
    <div className={cn("rounded-xl border px-4 py-3", toneStyles[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function MonitoringMetrics({ metrics }: MonitoringMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard label="Active connectors" value={metrics.activeConnectors} tone="green" />
      <MetricCard label="Failed connectors" value={metrics.failedConnectors} tone="red" />
      <MetricCard label="Events today" value={metrics.eventsToday} tone="blue" />
      <MetricCard label="Critical events" value={metrics.criticalEvents} tone="amber" />
      <MetricCard
        label="Connector health"
        value={`${metrics.connectorHealthPercent}%`}
        tone="green"
      />
      <MetricCard
        label="Last check"
        value={formatMonitoringTimestamp(metrics.lastCheckAt)}
        tone="slate"
      />
    </div>
  );
}
