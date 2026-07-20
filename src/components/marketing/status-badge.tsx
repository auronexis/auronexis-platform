import { StatusBadge as UiStatusBadge, type StatusBadgeTone } from "@/components/ui/badge";
import type { StatusLevel } from "@/lib/marketing/status-types";

export type { StatusLevel };

const statusTones: Record<StatusLevel, StatusBadgeTone> = {
  operational: "success",
  degraded: "warning",
  incident: "danger",
  maintenance: "info",
  unknown: "muted",
};

/** Public status page badge — composes the shared StatusBadge primitive. */
export function StatusBadge({ status }: { status: StatusLevel }) {
  return (
    <UiStatusBadge tone={statusTones[status]} className="capitalize">
      {status}
    </UiStatusBadge>
  );
}
