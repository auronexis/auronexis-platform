import type { ClientStatus } from "@/types/database";
import { CLIENT_STATUS_LABELS } from "@/lib/clients/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const statusTones: Record<ClientStatus, StatusBadgeTone> = {
  active: "success",
  watch: "warning",
  critical: "danger",
  archived: "muted",
};

type ClientStatusBadgeProps = {
  status: ClientStatus;
  className?: string;
};

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  return (
    <StatusBadge tone={statusTones[status]} className={className}>
      {CLIENT_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
