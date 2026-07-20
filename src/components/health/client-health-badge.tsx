import type { ClientHealthSummary } from "@/lib/health/types";
import { HEALTH_STATUS_LABELS, formatHealthTrend } from "@/lib/health/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const statusTones: Record<ClientHealthSummary["status"], StatusBadgeTone> = {
  excellent: "success",
  healthy: "info",
  watch: "warning",
  critical: "danger",
};

type ClientHealthBadgeProps = {
  summary: ClientHealthSummary | null | undefined;
  className?: string;
};

export function ClientHealthBadge({ summary, className }: ClientHealthBadgeProps) {
  if (!summary) {
    return (
      <StatusBadge tone="muted" className={className}>
        —
      </StatusBadge>
    );
  }

  const trend = formatHealthTrend(summary.delta);
  const trendTone =
    summary.delta > 0
      ? "text-success"
      : summary.delta < 0
        ? "text-critical"
        : "text-muted";

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <StatusBadge tone={statusTones[summary.status]}>
        <span className="font-semibold">{summary.score}</span>
        <span>{HEALTH_STATUS_LABELS[summary.status]}</span>
      </StatusBadge>
      <span className={cn("text-[11px] font-medium", trendTone)}>{trend}</span>
    </div>
  );
}
