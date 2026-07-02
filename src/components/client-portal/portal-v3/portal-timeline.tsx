import { PortalTimelineList } from "@/components/client-portal/portal-timeline-list";
import type { PortalTimelineEvent } from "@/lib/client-portal/types";

type PortalTimelineProps = {
  events: PortalTimelineEvent[];
};

export function PortalTimeline({ events }: PortalTimelineProps) {
  return <PortalTimelineList events={events} />;
}
