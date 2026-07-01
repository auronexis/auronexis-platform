import { ACTIVITY_EVENT_TYPE_LABELS } from "@/lib/activity/types";
import type { IncidentActivityView } from "@/lib/incidents/types";
import { formatIncidentDateTime } from "@/lib/incidents/types";
import { cn } from "@/lib/utils/cn";

type IncidentTimelineProps = {
  events: IncidentActivityView[];
  className?: string;
};

function resolveEventLabel(eventType: string): string {
  if (eventType in ACTIVITY_EVENT_TYPE_LABELS) {
    return ACTIVITY_EVENT_TYPE_LABELS[eventType as keyof typeof ACTIVITY_EVENT_TYPE_LABELS];
  }

  return eventType.replace("incident.", "").replaceAll("_", " ");
}

export function IncidentTimeline({ events, className }: IncidentTimelineProps) {
  if (events.length === 0) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        No timeline events recorded yet. Activity appears when incidents are created or updated.
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < events.length - 1 ? (
            <span
              className="absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px bg-border"
              aria-hidden
            />
          ) : null}
          <span
            className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-primary/30 bg-surface ring-4 ring-surface"
            aria-hidden
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <span className="rounded-full bg-muted/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                {resolveEventLabel(event.event_type)}
              </span>
            </div>
            {event.description ? (
              <p className="mt-1 text-sm text-muted">{event.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted">
              {event.actor?.full_name ?? "System"} · {formatIncidentDateTime(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
