import Link from "next/link";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityEventView } from "@/lib/activity/types";
import {
  ACTIVITY_ENTITY_LABELS,
  formatActivityTimestamp,
  getActivityEntityHref,
} from "@/lib/activity/types";
import { linkText } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";

type ActivityFeedProps = {
  events: ActivityEventView[];
  compact?: boolean;
  showEntityBadge?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
};

export function ActivityFeed({
  events,
  compact = false,
  showEntityBadge = false,
  emptyMessage = "No activity yet",
  emptyDescription = "Operational changes across your workspace will appear here as your team works.",
}: ActivityFeedProps) {
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
    <ul className={compact ? "space-y-3" : "divide-y divide-border/70"}>
      {events.map((event) => {
        const href = getActivityEntityHref(event.entity_type, event.entity_id);
        const actorName = event.actor?.full_name ?? "System";

        return (
          <li
            key={event.id}
            className={
              compact
                ? "rounded-xl border border-border/70 bg-muted/5 px-4 py-3"
                : "py-4 first:pt-0"
            }
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link href={href} className={cn(linkText, "font-semibold no-underline hover:underline")}>
                    {event.title}
                  </Link>
                ) : (
                  <p className="font-semibold text-foreground">{event.title}</p>
                )}
                {event.description ? (
                  <p className="mt-1 text-sm text-muted">{event.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {actorName}
                  {" · "}
                  {formatActivityTimestamp(event.created_at)}
                </p>
              </div>
              {!compact || showEntityBadge ? (
                <span className="shrink-0 rounded-full border border-border bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted">
                  {ACTIVITY_ENTITY_LABELS[event.entity_type]}
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
