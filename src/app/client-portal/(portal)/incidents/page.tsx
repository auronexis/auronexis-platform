import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";

import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";

import { PortalSlaStatus } from "@/components/sla/portal-sla-status";

import {

  PortalEmptyState,

  PortalPageHeader,

  PortalTableShell,

  portalTableCellClass,

  portalTableHeadClass,

} from "@/components/client-portal/portal-ui";

import { listPortalIncidents } from "@/lib/client-portal/queries";

import { requireClientPortalSession } from "@/lib/client-portal/session";

import { getOrganizationPlanContext } from "@/lib/plans/queries";

import { attachIncidentSlaInfo } from "@/lib/sla/queries";

import type { EntitySlaInfo } from "@/lib/sla/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";



export const metadata: Metadata = {

  title: "Portal Incidents",

};



export default async function ClientPortalIncidentsPage() {

  const session = await requireClientPortalSession();

  const plan = await getOrganizationPlanContext(session.organization.id);



  if (!plan.features.incidents) {

    redirect("/client-portal/overview");

  }



  const baseIncidents = (await listPortalIncidents(session)).map((incident) => ({

    ...incident,

    client_id: session.client.id,

    status: incident.status as IncidentStatus,

  }));



  const incidents = plan.features.sla_tracking

    ? await attachIncidentSlaInfo(session.organization.id, baseIncidents)

    : baseIncidents;



  return (

    <>

      <PortalPageHeader

        title="Open Incidents"

        description="Incidents currently being tracked for your account."

      />



      {incidents.length === 0 ? (

        <PortalEmptyState

          title="No open incidents"

          description="There are no open incidents to display right now."

        />

      ) : (

        <PortalTableShell>

          <table className="min-w-full divide-y divide-border-subtle">

            <thead>

              <tr>

                <th className={portalTableHeadClass}>Title</th>

                <th className={portalTableHeadClass}>Severity</th>

                <th className={portalTableHeadClass}>Status</th>

                {plan.features.sla_tracking ? (

                  <th className={portalTableHeadClass}>SLA</th>

                ) : null}

              </tr>

            </thead>

            <tbody className="divide-y divide-border-subtle">
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td className={`font-semibold text-foreground ${portalTableCellClass}`}>

                    {incident.title}

                  </td>

                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>

                    <RiskSeverityBadge severity={incident.severity as IncidentSeverity} />

                  </td>

                  <td className={`whitespace-nowrap ${portalTableCellClass}`}>

                    <IncidentStatusBadge status={incident.status as IncidentStatus} />

                  </td>

                  {plan.features.sla_tracking ? (

                    <td className={`whitespace-nowrap ${portalTableCellClass}`}>

                      <PortalSlaStatus
                        sla={(incident as unknown as { sla: EntitySlaInfo }).sla}
                      />

                    </td>

                  ) : null}

                </tr>

              ))}

            </tbody>

          </table>

        </PortalTableShell>

      )}

    </>

  );

}

