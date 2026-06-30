import type { ActivityEventView } from "@/lib/activity/types";
import { ActivityEmptyState } from "@/components/activity/activity-empty-state";
import { ActivityItem } from "@/components/activity/activity-item";
import { cn } from "@/lib/utils/cn";

type ActivityListProps = {
  events: ActivityEventView[];
  compact?: boolean;
  showEntityBadge?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
};

export function ActivityList({
  events,
  compact = false,
  showEntityBadge = true,
  emptyTitle,
  emptyDescription,
  className,
}: ActivityListProps) {
  if (events.length === 0) {
    return <ActivityEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn(compact ? "space-y-3" : "rounded-xl border border-border/70 bg-surface-1 px-4", className)}>
      {events.map((event) => (
        <ActivityItem
          key={event.id}
          event={event}
          compact={compact}
          showEntityBadge={showEntityBadge}
        />
      ))}
    </div>
  );
}
