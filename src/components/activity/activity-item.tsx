import Link from "next/link";
import type { ActivityEventView } from "@/lib/activity/types";
import {
  ACTIVITY_ENTITY_LABELS,
  formatActivityEventType,
  formatActivityRelativeTime,
  formatActivityTimestamp,
  getActivityEntityHref,
} from "@/lib/activity/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ActivityItemProps = {
  event: ActivityEventView;
  compact?: boolean;
  showEntityBadge?: boolean;
};

export function ActivityItem({ event, compact = false, showEntityBadge = true }: ActivityItemProps) {
  const href = getActivityEntityHref(event.entity_type, event.entity_id);
  const actorName = event.actor?.full_name ?? "System";
  const eventLabel = formatActivityEventType(event.event_type);

  return (
    <div
      className={cn(
        compact
          ? "rounded-xl border border-border/70 bg-muted/5 px-4 py-3"
          : "border-b border-border/70 py-4 last:border-b-0",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {eventLabel}
            </span>
            {showEntityBadge ? (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted/80">
                {ACTIVITY_ENTITY_LABELS[event.entity_type]}
              </span>
            ) : null}
          </div>

          {href ? (
            <Link
              href={href}
              className={cn(linkText, "mt-2 block font-semibold text-foreground no-underline hover:underline")}
            >
              {event.title}
            </Link>
          ) : (
            <p className="mt-2 font-semibold text-foreground">{event.title}</p>
          )}

          {event.description ? (
            <p className="mt-1 text-sm text-muted">{event.description}</p>
          ) : null}

          <p className="mt-1 text-xs text-muted">
            {actorName}
            {" · "}
            <time dateTime={event.created_at} title={formatActivityTimestamp(event.created_at)}>
              {formatActivityRelativeTime(event.created_at)}
            </time>
          </p>
        </div>
      </div>
    </div>
  );
}
