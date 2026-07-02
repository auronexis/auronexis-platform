import type { MonitoringEvent } from "@/lib/monitoring/types";
import { formatMonitoringTimestamp } from "@/lib/monitoring/types";
import { cn } from "@/lib/utils/cn";

const severityStyles = {
  low: "text-muted",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-danger",
} as const;

type MonitoringEventListProps = {
  events: MonitoringEvent[];
  emptyMessage?: string;
};

export function MonitoringEventList({
  events,
  emptyMessage = "No monitoring events recorded yet.",
}: MonitoringEventListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {events.map((event) => (
        <li key={event.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{event.message ?? "Monitoring event"}</p>
              <p className="mt-1 text-xs text-muted capitalize">
                {event.severity} · {event.status}
              </p>
            </div>
            <span className={cn("text-xs font-semibold uppercase", severityStyles[event.severity])}>
              {event.severity}
            </span>
          </div>
          <time className="mt-2 block text-xs text-muted">
            {formatMonitoringTimestamp(event.detected_at)}
          </time>
        </li>
      ))}
    </ul>
  );
}
