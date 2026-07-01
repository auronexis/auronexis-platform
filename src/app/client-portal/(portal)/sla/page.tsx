import type { Metadata } from "next";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalSlaCard } from "@/components/client-portal/portal-sla-card";
import { getPortalSlaSummary } from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal SLA",
};

export default async function ClientPortalSlaPage() {
  const session = await requireClientPortalSession();
  const summary = await getPortalSlaSummary(session);

  return (
    <>
      <PortalPageHeader
        title="SLA"
        description="Response-time commitments applied to your account."
      />
      <PortalSlaCard summary={summary} />
    </>
  );
}
