import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEventView } from "@/lib/activity/types";
import {
  ACTIVITY_ENTITY_LABELS,
  formatActivityTimestamp,
  getActivityEntityHref,
} from "@/lib/activity/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

const ENTITY_DOT_COLORS: Record<ActivityEventView["entity_type"], string> = {
  client: "bg-emerald-500",
  risk: "bg-orange-500",
  incident: "bg-red-500",
  report: "bg-violet-500",
  financial: "bg-green-500",
  team: "bg-primary",
  organization: "bg-muted",
};

type ActivityTimelineProps = {
  events: ActivityEventView[];
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
};

/** Timeline presentation for activity events — presentation only. */
export function ActivityTimeline({
  events,
  emptyMessage = "No recent activity yet.",
  emptyDescription = "Operational changes will appear here as your team works.",
  className,
}: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title={emptyMessage}
        description={emptyDescription}
        className="border-solid"
      />
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {events.map((event, index) => {
        const href = getActivityEntityHref(event.entity_type, event.entity_id);
        const actorName = event.actor?.full_name ?? "System";
        const isLast = index === events.length - 1;

        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[7px] top-4 h-[calc(100%-4px)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-surface",
                ENTITY_DOT_COLORS[event.entity_type] ?? "bg-primary",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {href ? (
                    <Link
                      href={href}
                      className={cn(linkText, "font-semibold no-underline hover:underline")}
                    >
                      {event.title}
                    </Link>
                  ) : (
                    <p className="font-semibold text-foreground">{event.title}</p>
                  )}
                  {event.description ? (
                    <p className="mt-1 text-sm text-muted">{event.description}</p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-border bg-muted/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {ACTIVITY_ENTITY_LABELS[event.entity_type]}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {actorName} · {formatActivityTimestamp(event.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
