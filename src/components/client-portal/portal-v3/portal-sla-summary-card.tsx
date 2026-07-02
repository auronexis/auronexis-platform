import { PortalSlaCard } from "@/components/client-portal/portal-sla-card";
import type { PortalSlaSummary } from "@/lib/sla/types";

type PortalSlaSummaryCardProps = {
  summary: PortalSlaSummary;
};

export function PortalSlaSummaryCard({ summary }: PortalSlaSummaryCardProps) {
  return <PortalSlaCard summary={summary} />;
}
