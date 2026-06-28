import type { ReportStatus } from "@/types/database";
import { REPORT_STATUS_LABELS } from "@/lib/reports/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<ReportStatus, string> = {
  draft: "bg-muted/10 text-muted ring-border/20",
  ready: "bg-blue-50 text-accent-blue ring-blue-600/20",
  published: "bg-violet-50 text-violet-700 ring-violet-600/20",
  sent: "bg-green-50 text-success ring-green-600/20",
  archived: "bg-muted/10 text-muted ring-border/20",
};

type ReportStatusBadgeProps = {
  status: ReportStatus;
  className?: string;
};

export function ReportStatusBadge({ status, className }: ReportStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
