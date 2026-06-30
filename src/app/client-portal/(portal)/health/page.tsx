import type { Metadata } from "next";
import { ClientHealthCard } from "@/components/health/client-health-card";
import { ClientHealthHistory } from "@/components/health/client-health-history";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import {
  getPortalLatestHealthSnapshot,
  listPortalHealthSnapshots,
} from "@/lib/client-portal/queries";
import { requireClientPortalSession } from "@/lib/client-portal/session";

export const metadata: Metadata = {
  title: "Portal Health",
};

export default async function ClientPortalHealthPage() {
  const session = await requireClientPortalSession();
  const [latest, history] = await Promise.all([
    getPortalLatestHealthSnapshot(session),
    listPortalHealthSnapshots(session, 10),
  ]);

  return (
    <>
      <PortalPageHeader
        title="Health"
        description="Your operational health score, trend, and contributing signals."
      />
      <ClientHealthCard snapshot={latest} />
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Health history</h2>
        <ClientHealthHistory snapshots={history} />
      </section>
    </>
  );
}
