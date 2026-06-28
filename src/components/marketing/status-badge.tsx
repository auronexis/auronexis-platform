import { cn } from "@/lib/utils/cn";

export type StatusLevel = "operational" | "degraded" | "incident" | "maintenance" | "unknown";

const statusStyles: Record<StatusLevel, string> = {
  operational: "bg-success/10 text-success border-success/20",
  degraded: "bg-warning/10 text-warning border-warning/20",
  incident: "bg-danger/10 text-danger border-danger/20",
  maintenance: "bg-primary/10 text-primary border-primary/20",
  unknown: "bg-muted/10 text-muted border-border",
};

export function StatusBadge({ status }: { status: StatusLevel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
