import type { ReportStatus } from "@/types/database";
import { REPORT_STATUS_LABELS } from "@/lib/reports/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const statusTones: Record<ReportStatus, StatusBadgeTone> = {
  draft: "muted",
  generated: "info",
  published: "success",
  archived: "muted",
};

type ReportStatusBadgeProps = {
  status: ReportStatus;
  className?: string;
};

export function ReportStatusBadge({ status, className }: ReportStatusBadgeProps) {
  return (
    <StatusBadge tone={statusTones[status]} className={className}>
      {REPORT_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
