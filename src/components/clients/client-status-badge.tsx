import type { ClientStatus } from "@/types/database";
import { CLIENT_STATUS_LABELS } from "@/lib/clients/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<ClientStatus, string> = {
  active: "bg-green-50 text-success ring-green-600/20",
  watch: "bg-amber-50 text-warning ring-amber-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
  archived: "bg-muted/10 text-muted ring-border/20",
};

type ClientStatusBadgeProps = {
  status: ClientStatus;
  className?: string;
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {CLIENT_STATUS_LABELS[status]}
    </span>
  );
}
