import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalEmptyState, PortalPageHeader } from "@/components/client-portal/portal-ui";
import { PortalIncidentCard } from "@/components/client-portal/portal-v3/portal-incident-card";
import { getPortalIncidents } from "@/lib/client-portal/portal-incidents";
import { requireClientPortalSession } from "@/lib/client-portal/session";
import { getOrganizationPlanContext } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Portal Incidents",
};

export default async function ClientPortalIncidentsPage() {
  const session = await requireClientPortalSession();
  const plan = await getOrganizationPlanContext(session.organization.id);

  if (!plan.features.incidents) {
    redirect("/client-portal/overview");
  }

  const incidents = await getPortalIncidents(session);

  return (
    <>
      <PortalPageHeader
        title="Shared incidents"
        description="Client-safe incidents your agency has chosen to share with your portal."
      />

      {incidents.length === 0 ? (
        <PortalEmptyState
          title="No shared incidents"
          description="Your agency has not shared any incidents with your portal yet."
        />
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <PortalIncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </>
  );
}
