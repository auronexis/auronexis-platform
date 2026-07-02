import type { Metadata } from "next";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalTimeline } from "@/components/client-portal/portal-v3";
import { getPortalTimeline } from "@/lib/client-portal/portal-timeline";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Timeline",
};

export default async function ClientPortalTimelinePage() {
  const session = await requireClientPortalSession();
  const events = await getPortalTimeline(session, 20);

  return (
    <>
      <PortalPageHeader
        title="Timeline"
        description="Client-facing updates about your account, reports, health, and SLA."
      />
      <PortalTimeline events={events} />
    </>
  );
}
