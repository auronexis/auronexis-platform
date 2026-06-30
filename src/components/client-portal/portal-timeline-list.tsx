import Link from "next/link";
import type { PortalTimelineEvent } from "@/lib/client-portal/types";
import { ACTIVITY_EVENT_TYPE_LABELS, type ActivityEventType } from "@/lib/activity/types";
import { formatReportDate } from "@/lib/reports/types";
import { linkText } from "@/lib/ui/tokens";
import {
  PortalEmptyState,
  PortalTableShell,
  portalTableCellClass,
  portalTableHeadClass,
} from "@/components/client-portal/portal-ui";

type PortalTimelineListProps = {
  events: PortalTimelineEvent[];
  emptyTitle?: string;
  emptyDescription?: string;
  showViewAll?: boolean;
};

function eventLabel(eventType: string): string {
  if (eventType in ACTIVITY_EVENT_TYPE_LABELS) {
    return ACTIVITY_EVENT_TYPE_LABELS[eventType as ActivityEventType];
  }

  return eventType.replaceAll(".", " ");
}

export function PortalTimelineList({
  events,
  emptyTitle = "No timeline activity yet",
  emptyDescription = "Updates about your account will appear here as your agency shares progress.",
  showViewAll = false,
}: PortalTimelineListProps) {
  if (events.length === 0) {
    return (
      <PortalEmptyState title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <div className="space-y-4">
      <PortalTableShell>
        <table className="min-w-full divide-y divide-border-subtle">
          <thead>
            <tr>
              <th className={portalTableHeadClass}>Event</th>
              <th className={portalTableHeadClass}>Details</th>
              <th className={portalTableHeadClass}>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {events.map((event) => (
              <tr key={event.id}>
                <td className={`${portalTableCellClass} font-semibold text-foreground`}>
                  {eventLabel(event.event_type)}
                </td>
                <td className={portalTableCellClass}>
                  <p className="font-medium text-foreground">{event.title}</p>
                  {event.description ? (
                    <p className="mt-1 text-sm text-muted">{event.description}</p>
                  ) : null}
                </td>
                <td className={`${portalTableCellClass} whitespace-nowrap text-muted`}>
                  {formatReportDate(event.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PortalTableShell>

      {showViewAll ? (
        <Link href="/client-portal/timeline" className={linkText}>
          View full timeline
        </Link>
      ) : null}
    </div>
  );
}
