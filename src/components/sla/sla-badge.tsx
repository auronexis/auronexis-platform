import { SlaStatusBadge } from "@/components/sla/sla-status-badge";
import type { SlaStatus } from "@/lib/sla/calculations";

type SLABadgeProps = {
  status: SlaStatus;
  className?: string;
};

export function SLABadge(props: SLABadgeProps) {
  return <SlaStatusBadge {...props} />;
}
