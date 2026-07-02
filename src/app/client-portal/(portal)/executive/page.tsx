import type { Metadata } from "next";
import { PortalExecutiveSummary } from "@/components/client-portal/portal-v3";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { recordPortalActivity } from "@/lib/client-portal/activity";
import { getPortalExecutiveOverview } from "@/lib/executive-reports/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Executive Overview",
};

export default async function ClientPortalExecutivePage() {
  const session = await requireClientPortalSession();
  const executiveOverview = await getPortalExecutiveOverview(
    session.organization.id,
    session.client.id,
  );

  void recordPortalActivity(session, {
    eventType: "portal.viewed",
    title: "Portal executive overview viewed",
  }).catch(() => undefined);

  return (
    <>
      <PortalPageHeader
        title="Executive overview"
        description="Read-only leadership summary from your latest published report."
      />
      <PortalExecutiveSummary snapshot={executiveOverview} />
    </>
  );
}
