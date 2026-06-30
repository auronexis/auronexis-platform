import type { HealthTrend } from "@/lib/reports-v2/types";
import { HEALTH_STATUS_LABELS, type HealthStatus } from "@/lib/health/types";

type ReportHealthChartProps = {
  trend: HealthTrend | null;
  healthScore?: number | null;
};

export function ReportHealthChart({ trend, healthScore }: ReportHealthChartProps) {
  const score = healthScore ?? trend?.current ?? null;
  const points = trend?.points ?? [];

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">Health trend</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{score ?? "—"}</p>
          {trend?.status ? (
            <p className="mt-1 text-sm text-muted">
              {HEALTH_STATUS_LABELS[trend.status as HealthStatus] ?? trend.status}
            </p>
          ) : null}
        </div>
        {trend?.delta != null ? (
          <p className={trend.delta >= 0 ? "text-success" : "text-danger"}>
            {trend.delta > 0 ? `+${trend.delta}` : trend.delta}
          </p>
        ) : null}
      </div>
      {points.length > 0 ? (
        <div className="mt-6 flex items-end gap-2">
          {points
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
        <p className="mt-4 text-sm text-muted">Health history will appear after snapshots are recorded.</p>
      )}
    </div>
  );
}
