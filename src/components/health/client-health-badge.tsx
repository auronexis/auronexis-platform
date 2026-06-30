import type { ClientHealthSummary } from "@/lib/health/types";
import {
  HEALTH_STATUS_LABELS,
  formatHealthTrend,
} from "@/lib/health/types";
import { cn } from "@/lib/utils/cn";

const statusStyles = {
  excellent: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/30 dark:text-green-300",
  healthy: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-300",
  watch: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-300",
  critical: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-300",
  muted: "bg-muted/10 text-muted ring-border-subtle",
};

type ClientHealthBadgeProps = {
  summary: ClientHealthSummary | null | undefined;
  className?: string;
};

export function ClientHealthBadge({ summary, className }: ClientHealthBadgeProps) {
  if (!summary) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          statusStyles.muted,
          className,
        )}
      >
        —
      </span>
    );
  }

  const trend = formatHealthTrend(summary.delta);
  const trendTone =
    summary.delta > 0 ? "text-green-600 dark:text-green-300" : summary.delta < 0 ? "text-red-600 dark:text-red-300" : "text-muted";

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          statusStyles[summary.status],
        )}
      >
        <span className="font-semibold">{summary.score}</span>
        <span>{HEALTH_STATUS_LABELS[summary.status]}</span>
      </span>
      <span className={cn("text-[11px] font-medium", trendTone)}>{trend}</span>
    </div>
  );
}
