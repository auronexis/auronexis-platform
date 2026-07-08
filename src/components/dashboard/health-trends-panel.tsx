import { LineChart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { HEALTH_STATUS_LABELS, type HealthStatus } from "@/lib/health/types";
import type { OrganizationHealthTrend } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";

type HealthTrendsPanelProps = {
  trends: OrganizationHealthTrend[];
};

export function HealthTrendsPanel({ trends }: HealthTrendsPanelProps) {
  const hasAnyData = trends.some((trend) => trend.hasData);

  if (!hasAnyData) {
    return (
      <EmptyState
        icon={LineChart}
        title="Health trends will appear after snapshots"
        description="As client health snapshots are recorded, 7, 30, and 90-day portfolio trends will display here."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {trends.map((trend) => (
        <HealthTrendCard key={trend.periodDays} trend={trend} />
      ))}
    </div>
  );
}

function HealthTrendCard({ trend }: { trend: OrganizationHealthTrend }) {
  if (!trend.hasData) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">{trend.label}</p>
        <p className="mt-2 text-sm text-muted">Insufficient data for this period.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-surface/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{trend.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {trend.averageScore ?? "—"}
          </p>
          {trend.status ? (
            <p className="mt-1 text-sm text-muted">
              {HEALTH_STATUS_LABELS[trend.status as HealthStatus] ?? trend.status}
            </p>
          ) : null}
        </div>
        {trend.delta != null ? (
          <p className={cn("text-sm font-medium", trend.delta >= 0 ? "text-success" : "text-danger")}>
            {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
          </p>
        ) : null}
      </div>

      {trend.points.length > 0 ? (
        <div className="mt-5 flex items-end gap-1.5">
          {trend.points
            .slice()
            .reverse()
            .map((point) => (
              <div key={point.calculatedAt} className="flex-1">
                <div
                  className="rounded-t bg-primary/70"
                  style={{ height: `${Math.max(12, point.score)}px` }}
                  title={`${point.score} — ${point.calculatedAt}`}
                />
              </div>
            ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">Trend bars will refine as more snapshots are captured.</p>
      )}
    </div>
  );
}
