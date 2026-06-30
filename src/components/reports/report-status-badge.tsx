import type { ReportStatus } from "@/types/database";
import { REPORT_STATUS_LABELS } from "@/lib/reports/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<ReportStatus, string> = {
  draft: "bg-muted/10 text-muted ring-border/20",
  generated: "bg-blue-50 text-accent-blue ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-300",
  published: "bg-green-50 text-success ring-green-600/20 dark:bg-green-950/30 dark:text-green-300",
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
