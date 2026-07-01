import Link from "next/link";
import type { IncidentActivityView } from "@/lib/incidents/types";
import { formatIncidentDateTime } from "@/lib/incidents/types";
import { linkText } from "@/lib/ui/tokens";

type IncidentActivityFeedProps = {
  events: IncidentActivityView[];
};

export function IncidentActivityFeed({ events }: IncidentActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted">
        No activity recorded for this incident yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-surface/40">
      {events.map((event) => (
        <li key={event.id} className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              {event.description ? (
                <p className="mt-1 text-sm text-muted">{event.description}</p>
              ) : null}
            </div>
            <time className="shrink-0 text-xs text-muted">
              {formatIncidentDateTime(event.created_at)}
            </time>
          </div>
          <p className="mt-2 text-xs text-muted">
            {event.actor?.full_name ?? "System"} · {event.event_type.replace("incident.", "")}
          </p>
        </li>
      ))}
      <li className="px-4 py-3 text-sm">
        <Link href="/activity?filter=incidents" className={linkText}>
          View all incident activity →
        </Link>
      </li>
    </ul>
  );
}
