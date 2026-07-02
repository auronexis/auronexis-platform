import type { Metadata } from "next";
import { PortalHealthSummary } from "@/components/client-portal/portal-v3";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { getPortalHealth } from "@/lib/client-portal/portal-health";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Health",
};

export default async function ClientPortalHealthPage() {
  const session = await requireClientPortalSession();
  const { latest, history } = await getPortalHealth(session);

  return (
    <>
      <PortalPageHeader
        title="Health"
        description="Your operational health score, trend, and client-safe explanation."
      />
      <PortalHealthSummary latest={latest} history={history} />
    </>
  );
}
