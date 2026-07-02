import type { Metadata } from "next";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalSlaSummaryCard } from "@/components/client-portal/portal-v3";
import { getPortalSLA } from "@/lib/client-portal/portal-sla";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal SLA",
};

export default async function ClientPortalSlaPage() {
  const session = await requireClientPortalSession();
  const sla = await getPortalSLA(session);

  return (
    <>
      <PortalPageHeader
        title="SLA"
        description="Response-time commitments applied to your account."
      />
      <PortalSlaSummaryCard summary={sla} />
    </>
  );
}
