import type { HealthSnapshot } from "@/lib/health/types";
import {
  HEALTH_STATUS_LABELS,
  formatHealthTimestamp,
  formatHealthTrend,
} from "@/lib/health/types";
import { cn } from "@/lib/utils/cn";

const statusStyles = {
  excellent: "text-green-600 dark:text-green-300",
  healthy: "text-blue-600 dark:text-blue-300",
  watch: "text-amber-600 dark:text-amber-300",
  critical: "text-red-600 dark:text-red-300",
};

type ClientHealthCardProps = {
  snapshot: HealthSnapshot | null;
};

export function ClientHealthCard({ snapshot }: ClientHealthCardProps) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-6">
        <p className="text-sm font-medium text-foreground">No health history available</p>
        <p className="mt-1 text-sm text-muted">
          Health snapshots will appear after the engine calculates this client&apos;s operational score.
        </p>
      </div>
    );
  }

  const breakdownItems = [...snapshot.breakdown.penalties, ...snapshot.breakdown.bonuses];
  const trend = formatHealthTrend(snapshot.delta);
  const trendTone =
    snapshot.delta > 0 ? "text-green-600 dark:text-green-300" : snapshot.delta < 0 ? "text-red-600 dark:text-red-300" : "text-muted";

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">Health</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-semibold tracking-tight text-foreground">{snapshot.score}</p>
            <p className={cn("pb-1 text-lg font-semibold", statusStyles[snapshot.status])}>
              {HEALTH_STATUS_LABELS[snapshot.status]}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-sm font-semibold", trendTone)}>{trend}</p>
          <p className="mt-1 text-xs text-muted">
            Last calculated {formatHealthTimestamp(snapshot.calculated_at)}
          </p>
        </div>
      </div>

      {snapshot.reason ? (
        <p className="mt-4 text-sm text-foreground">
          <span className="font-medium text-muted">Reason: </span>
          {snapshot.reason}
        </p>
      ) : null}

      {breakdownItems.length > 0 ? (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Breakdown</p>
          <ul className="mt-3 space-y-2">
            {breakdownItems.map((item) => (
              <li key={`${item.label}-${item.points}`} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{item.label}</span>
                <span className={item.points >= 0 ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}>
                  {item.points > 0 ? `+${item.points}` : item.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
