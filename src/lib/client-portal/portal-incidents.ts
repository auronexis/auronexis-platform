import "server-only";

import type { ClientPortalSessionContext, PortalIncidentDetailView, PortalIncidentView } from "@/lib/client-portal/types";
import { PORTAL_INCIDENT_DETAIL_SELECT, PORTAL_INCIDENT_SELECT } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";

/** Portal-visible incidents for the signed-in client — never throws. */
export async function getPortalIncidents(
  session: ClientPortalSessionContext,
): Promise<PortalIncidentView[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incidents")
      .select(PORTAL_INCIDENT_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id)
      .eq("portal_visible", true)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => {
      const incident = row as Record<string, unknown>;
      return {
        id: String(incident.id),
        title: String(incident.title),
        severity: String(incident.severity),
        status: String(incident.status),
        clientSummary:
          (incident.client_summary as string | null) ??
          (incident.description as string | null) ??
          null,
        detectedAt: String(incident.occurred_at ?? incident.created_at),
        resolvedAt: (incident.resolved_at as string | null) ?? null,
        created_at: String(incident.created_at),
      };
    });
  } catch {
    return [];
  }
}

/** Single portal-visible incident detail — never throws. */
export async function getPortalIncidentDetail(
  session: ClientPortalSessionContext,
  incidentId: string,
): Promise<PortalIncidentDetailView | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("incidents")
      .select(PORTAL_INCIDENT_DETAIL_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id)
      .eq("id", incidentId)
      .eq("portal_visible", true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const incident = data as Record<string, unknown>;
    return {
      id: String(incident.id),
      title: String(incident.title),
      severity: String(incident.severity),
      status: String(incident.status),
      clientSummary:
        (incident.client_summary as string | null) ??
        (incident.description as string | null) ??
        null,
      resolutionSummary: (incident.resolution_notes as string | null) ?? null,
      detectedAt: String(incident.occurred_at ?? incident.created_at),
      resolvedAt: (incident.resolved_at as string | null) ?? null,
      created_at: String(incident.created_at),
    };
  } catch {
    return null;
  }
}
