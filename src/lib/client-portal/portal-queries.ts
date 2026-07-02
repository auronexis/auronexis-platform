import "server-only";

import { getPortalExecutiveOverview } from "@/lib/executive-reports/queries";
import { getPortalHealth } from "@/lib/client-portal/portal-health";
import { getPortalIncidents } from "@/lib/client-portal/portal-incidents";
import { getPortalPublishedReports } from "@/lib/client-portal/portal-reports";
import { getPortalSLA } from "@/lib/client-portal/portal-sla";
import { getPortalContacts } from "@/lib/client-portal/portal-support";
import { getPortalTimeline } from "@/lib/client-portal/portal-timeline";
import type { ClientPortalSessionContext, PortalOverviewDataV3 } from "@/lib/client-portal/types";

/** Portal overview workspace — never throws. */
export async function getPortalOverview(
  session: ClientPortalSessionContext,
  supportEmail: string | null,
): Promise<PortalOverviewDataV3> {
  try {
    const [health, reports, sla, incidents, timeline, contacts, executiveOverview] =
      await Promise.all([
        getPortalHealth(session),
        getPortalPublishedReports(session),
        getPortalSLA(session),
        getPortalIncidents(session),
        getPortalTimeline(session, 5),
        getPortalContacts(session, supportEmail),
        getPortalExecutiveOverview(session.organization.id, session.client.id),
      ]);

    const openIncidents = incidents.filter(
      (incident) => incident.status === "open" || incident.status === "investigating",
    );

    return {
      clientName: session.client.name,
      health: health.latest
        ? {
            score: health.latest.score,
            status: health.latest.status,
            delta: health.latest.delta,
            reason: health.latest.reason,
            calculated_at: health.latest.calculated_at,
          }
        : null,
      executiveOverview,
      latestReport: reports[0] ?? null,
      slaSummary: sla,
      openIncidents,
      openIncidentsCount: openIncidents.length,
      recentEvents: timeline,
      contacts,
    };
  } catch (error) {
    console.warn("[client-portal] getPortalOverview failed:", error);
    return {
      clientName: session.client.name,
      health: null,
      executiveOverview: null,
      latestReport: null,
      slaSummary: {
        assignment: { assignedPolicyId: null, effectivePolicy: null, source: "none" },
        policyName: null,
        compliancePercent: 100,
        responseTarget: "—",
        resolutionTarget: "—",
        breachCount: 0,
      },
      openIncidents: [],
      openIncidentsCount: 0,
      recentEvents: [],
      contacts: {
        contactName: session.client.contact_name,
        contactEmail: session.client.contact_email,
        accountOwnerName: null,
        supportEmail,
      },
    };
  }
}
