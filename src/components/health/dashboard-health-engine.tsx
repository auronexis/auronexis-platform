import type { HealthDashboardMetrics } from "@/lib/health/types";

type DashboardHealthEngineProps = {
  metrics: HealthDashboardMetrics;
};

function MetricTile({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
    </div>
  );
}

export function DashboardHealthEngine({ metrics }: DashboardHealthEngineProps) {
  if (!metrics.hasSnapshots) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No health history available</p>
        <p className="mt-1 text-sm text-muted">
          Health snapshots will appear after client health scores are calculated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <MetricTile
          label="Average health"
          value={metrics.averageScore ?? "—"}
          description={`Across ${metrics.trackedClients} tracked client${metrics.trackedClients === 1 ? "" : "s"}`}
        />
        <MetricTile label="Excellent clients" value={metrics.excellentClients} />
        <MetricTile label="Watch clients" value={metrics.watchClients} />
        <MetricTile label="Critical clients" value={metrics.criticalClients} />
        <MetricTile
          label="30-day trend"
          value={metrics.trendDelta == null ? "—" : `${metrics.trendDelta > 0 ? "+" : ""}${metrics.trendDelta}`}
          description={metrics.trendLabel}
        />
        <MetricTile label="Healthy clients" value={metrics.healthyClients} />
      </div>
    </div>
  );
}
