import type { ClientSuccessHealthStatus } from "@/lib/customer-success/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const STATUS_LABELS: Record<ClientSuccessHealthStatus, string> = {
  healthy: "Healthy",
  stable: "Stable",
  watch: "Watch",
  at_risk: "At risk",
  critical: "Critical",
  insufficient_data: "Insufficient data",
};

const STATUS_TONES: Record<ClientSuccessHealthStatus, StatusBadgeTone> = {
  healthy: "success",
  stable: "info",
  watch: "warning",
  at_risk: "danger",
  critical: "danger",
  insufficient_data: "muted",
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
    <StatusBadge
      tone={STATUS_TONES[status]}
      className={className}
      aria-label={`Client health: ${STATUS_LABELS[status]}${score !== undefined ? `, score ${score}` : ""}`}
    >
      {STATUS_LABELS[status]}
      {score !== undefined ? <span className="opacity-80">· {score}</span> : null}
    </StatusBadge>
  );
}
