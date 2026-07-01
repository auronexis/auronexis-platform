import { formatActivityTimestamp } from "@/lib/activity/types";
import type { SlaActivityView } from "@/lib/sla/types";
import { cn } from "@/lib/utils/cn";

type SLATimelineProps = {
  events: SlaActivityView[];
  emptyMessage?: string;
  className?: string;
};

export function SLATimeline({
  events,
  emptyMessage = "No SLA activity recorded yet.",
  className,
}: SLATimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center text-sm text-muted", className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className={cn("space-y-4", className)}>
      {events.map((event) => (
        <li key={event.id} className="rounded-xl border border-border/70 bg-surface/40 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{event.message ?? event.event_type}</p>
              <p className="mt-1 text-xs text-muted">{event.event_type.replaceAll(".", " · ")}</p>
            </div>
            <time className="shrink-0 text-xs text-muted">{formatActivityTimestamp(event.created_at)}</time>
          </div>
        </li>
      ))}
    </ol>
  );
}
