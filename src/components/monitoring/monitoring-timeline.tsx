import type { MonitoringActivityView } from "@/lib/monitoring/types";
import { formatMonitoringTimestamp } from "@/lib/monitoring/types";

type MonitoringTimelineProps = {
  items: MonitoringActivityView[];
  emptyMessage?: string;
};

export function MonitoringTimeline({
  items,
  emptyMessage = "No monitoring activity yet.",
}: MonitoringTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{item.message ?? item.event_type}</p>
            <p className="mt-1 text-xs text-muted">{item.event_type.replace(/\./g, " · ")}</p>
          </div>
          <time className="shrink-0 text-xs text-muted">{formatMonitoringTimestamp(item.created_at)}</time>
        </li>
      ))}
    </ul>
  );
}
