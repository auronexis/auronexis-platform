import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import { formatSlaDueDate } from "@/lib/sla/calculations";
import type { EntitySlaInfo } from "@/lib/sla/types";

type PortalSlaStatusProps = {
  sla: EntitySlaInfo;
};

export function PortalSlaStatus({ sla }: PortalSlaStatusProps) {
  if (!sla.status) {
    return <span className="text-sm text-muted">—</span>;
  }

  return (
    <div className="space-y-1">
      <SlaStatusBadge status={sla.status} />
      <p className="text-xs text-muted">Due {formatSlaDueDate(sla.slaDueAt)}</p>
      <p className="text-xs text-muted">{sla.remainingLabel ?? "—"}</p>
    </div>
  );
}
