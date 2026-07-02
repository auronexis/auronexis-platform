import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalIncidentDetail } from "@/components/client-portal/portal-v3";
import { PortalPageHeader } from "@/components/client-portal/portal-ui";
import { recordPortalActivity } from "@/lib/client-portal/activity";
import { getPortalIncidentDetail } from "@/lib/client-portal/portal-incidents";
import { requireClientPortalSession } from "@/lib/client-portal/session";

type PortalIncidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PortalIncidentDetailPageProps): Promise<Metadata> {
  const session = await requireClientPortalSession();
  const { id } = await params;
  const incident = await getPortalIncidentDetail(session, id);
  return { title: incident?.title ?? "Incident" };
}

export default async function ClientPortalIncidentDetailPage({ params }: PortalIncidentDetailPageProps) {
  const session = await requireClientPortalSession();
  const { id } = await params;
  const incident = await getPortalIncidentDetail(session, id);

  if (!incident) {
    notFound();
  }

  void recordPortalActivity(session, {
    eventType: "portal.incident_viewed",
    title: `Portal incident viewed: ${incident.title}`,
    metadata: { incidentId: incident.id },
  }).catch(() => undefined);

  return (
    <>
      <Link href="/client-portal/incidents" className="text-sm font-medium text-primary hover:underline">
        ← Back to incidents
      </Link>
      <div className="mt-4">
        <PortalPageHeader
          title="Incident"
          description="Client-safe incident summary shared by your agency."
        />
      </div>
      <PortalIncidentDetail incident={incident} />
    </>
  );
}
