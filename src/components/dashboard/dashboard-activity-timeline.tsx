import Link from "next/link";
import type { ActivityEventView, ActivityEntityType } from "@/lib/activity/types";
import {
  formatActivityEventType,
  formatActivityRelativeTime,
  getActivityEntityHref,
} from "@/lib/activity/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type DashboardActivityTimelineProps = {
  events: ActivityEventView[];
  emptyMessage?: string;
};

const ENTITY_DOT_STYLES: Record<ActivityEntityType, string> = {
  client: "bg-primary",
  risk: "bg-warning",
  incident: "bg-danger",
  report: "bg-emerald-500",
  financial: "bg-violet-500",
  team: "bg-sky-500",
  organization: "bg-muted",
};

export function DashboardActivityTimeline({
  events,
  emptyMessage = "No activity recorded yet. Actions across your workspace will appear here.",
}: DashboardActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">All quiet for now</p>
        <p className="mt-1 text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, index) => {
        const href = getActivityEntityHref(event.entity_type, event.entity_id);
        const actorName = event.actor?.full_name ?? "System";
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="relative pl-6">
            {!isLast ? (
              <span
                className="absolute left-[7px] top-4 h-[calc(100%+0.25rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                "absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-surface",
                ENTITY_DOT_STYLES[event.entity_type],
              )}
              aria-hidden
            />

            <div
              className={cn("pb-5", transitionInteractive)}
            >
              {href ? (
                <Link
                  href={href}
                  className={cn(
                    "text-sm font-medium text-foreground hover:text-primary",
                    focusRing,
                  )}
                >
                  {event.title}
                </Link>
              ) : (
                <p className="text-sm font-medium text-foreground">{event.title}</p>
              )}

              {event.description ? (
                <p className="mt-1 text-sm text-muted">{event.description}</p>
              ) : null}

              <p className="mt-1 text-xs text-muted/80">
                {formatActivityEventType(event.event_type)}
                {" · "}
                {actorName} · {formatActivityRelativeTime(event.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
