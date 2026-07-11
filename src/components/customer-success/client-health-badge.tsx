import type { ClientSuccessHealthStatus } from "@/lib/customer-success/types";
import { cn } from "@/lib/utils/cn";

const STATUS_LABELS: Record<ClientSuccessHealthStatus, string> = {
  healthy: "Healthy",
  stable: "Stable",
  watch: "Watch",
  at_risk: "At risk",
  critical: "Critical",
  insufficient_data: "Insufficient data",
};

const STATUS_TONES: Record<ClientSuccessHealthStatus, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  stable: "bg-info/10 text-info border-info/20",
  watch: "bg-warning/10 text-warning border-warning/20",
  at_risk: "bg-danger/10 text-danger border-danger/20",
  critical: "bg-danger/15 text-danger border-danger/30",
  insufficient_data: "bg-muted/15 text-muted border-border",
};

export function ClientHealthBadge({
  status,
  score,
  className,
}: {
  status: ClientSuccessHealthStatus;
  score?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STATUS_TONES[status],
        className,
      )}
      aria-label={`Client health: ${STATUS_LABELS[status]}${score !== undefined ? `, score ${score}` : ""}`}
    >
      {STATUS_LABELS[status]}
      {score !== undefined ? <span className="text-muted">· {score}</span> : null}
    </span>
  );
}
