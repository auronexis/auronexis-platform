import type { Metadata } from "next";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalTimelineList } from "@/components/client-portal/portal-timeline-list";
import { listPortalTimelineEvents } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Timeline",
};

export default async function ClientPortalTimelinePage() {
  const session = await requireClientPortalSession();
  const events = await listPortalTimelineEvents(session, 20);

  return (
    <>
      <PortalPageHeader
        title="Timeline"
        description="Client-facing updates about your account, reports, health, and SLA."
      />
      <PortalTimelineList events={events} />
    </>
  );
}
