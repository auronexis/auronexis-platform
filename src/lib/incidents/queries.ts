import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { CriticalIncidentAlert, IncidentActivityView, IncidentSummary, IncidentWithRelations, RiskOption } from "@/lib/incidents/types";
import {
  INCIDENT_LIST_SELECT,
  INCIDENT_SELECT_COLUMNS,
  OPEN_INCIDENT_STATUSES,
} from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";

type ListIncidentsOptions = {
  includeArchived?: boolean;
  status?: IncidentWithRelations["status"] | IncidentWithRelations["status"][];
  severity?: IncidentWithRelations["severity"];
};

const EMPTY_INCIDENT_SUMMARY: IncidentSummary = {
  openCount: 0,
  criticalCount: 0,
  investigatingCount: 0,
  resolvedCount: 0,
  mttrHours: null,
  resolvedPercent: 0,
};

/** List incidents for the current organization with related names. */
export async function listIncidents(
  session: SessionContext,
  options: ListIncidentsOptions = {},
): Promise<IncidentWithRelations[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("incidents")
      .select(INCIDENT_LIST_SELECT)
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    } else if (!options.includeArchived) {
      query = query.neq("status", "archived");
    }

    if (options.severity) {
      query = query.eq("severity", options.severity);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[incidents] listIncidents failed:", error.message);
      return [];
    }

    return (data ?? []) as IncidentWithRelations[];
  } catch (error) {
    console.warn("[incidents] listIncidents failed:", error);
    return [];
  }
}

/** Load a single incident by id within the current organization. */
export async function getIncidentById(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentWithRelations | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("incidents")
      .select(INCIDENT_LIST_SELECT)
      .eq("id", incidentId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    if (error) {
      console.warn("[incidents] getIncidentById failed:", error.message);
      return null;
    }

    return (data as IncidentWithRelations | null) ?? null;
  } catch (error) {
    console.warn("[incidents] getIncidentById failed:", error);
    return null;
  }
}

/** Active V2 risks available for optional incident linking. */
export async function listLinkableRisks(session: SessionContext): Promise<RiskOption[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("client_risks")
      .select("id, title, client_id")
      .eq("organization_id", session.organization.id)
      .in("status", OPEN_RISK_STATUSES)
      .order("title", { ascending: true });

    if (error) {
      console.warn("[incidents] listLinkableRisks failed:", error.message);
      return [];
    }

    return (data ?? []) as RiskOption[];
  } catch (error) {
    console.warn("[incidents] listLinkableRisks failed:", error);
    return [];
  }
}

/** Dashboard metrics for open and critical incidents. */
export async function getIncidentDashboardMetrics(session: SessionContext): Promise<{
  openIncidentCount: number;
  criticalIncidents: CriticalIncidentAlert[];
}> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;

    const { count, error: countError } = await supabase
      .from("incidents")
      .select(INCIDENT_SELECT_COLUMNS, { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", OPEN_INCIDENT_STATUSES);

    if (countError) {
      console.warn("[incidents] getIncidentDashboardMetrics count failed:", countError.message);
      return { openIncidentCount: 0, criticalIncidents: [] };
    }

    const { data, error } = await supabase
      .from("incidents")
      .select("id, title, severity, status, due_at, clients ( name )")
      .eq("organization_id", organizationId)
      .eq("severity", "critical")
      .in("status", OPEN_INCIDENT_STATUSES)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(5);

    if (error) {
      console.warn("[incidents] getIncidentDashboardMetrics list failed:", error.message);
      return { openIncidentCount: count ?? 0, criticalIncidents: [] };
    }

    return {
      openIncidentCount: count ?? 0,
      criticalIncidents: (data ?? []) as CriticalIncidentAlert[],
    };
  } catch (error) {
    console.warn("[incidents] getIncidentDashboardMetrics failed:", error);
    return { openIncidentCount: 0, criticalIncidents: [] };
  }
}

const INCIDENT_ACTIVITY_SELECT = `
  id,
  organization_id,
  incident_id,
  actor_user_id,
  event_type,
  title,
  description,
  metadata,
  created_at,
  actor:users!incident_activity_actor_user_id_fkey ( full_name )
`;

/** Incident timeline entries for detail view. */
export async function listIncidentActivity(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentActivityView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incident_activity")
    .select(INCIDENT_ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[incidents] listIncidentActivity failed:", error.message);
    return [];
  }

  return (data ?? []) as IncidentActivityView[];
}

/** Dashboard KPIs for the incident command center. */
export async function getIncidentSummary(session: SessionContext): Promise<IncidentSummary> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;

    const { data, error } = await supabase
      .from("incidents")
      .select("status, severity, created_at, resolved_at")
      .eq("organization_id", organizationId)
      .neq("status", "archived");

    if (error) {
      console.warn("[incidents] getIncidentSummary failed:", error.message);
      return EMPTY_INCIDENT_SUMMARY;
    }

    const rows = (data ?? []) as Array<{
      status: IncidentWithRelations["status"];
      severity: IncidentWithRelations["severity"];
      created_at: string;
      resolved_at: string | null;
    }>;

    let openCount = 0;
    let investigatingCount = 0;
    let resolvedCount = 0;
    let criticalCount = 0;
    const resolutionDurationsMs: number[] = [];

    for (const row of rows) {
      if (row.status === "open") {
        openCount += 1;
      } else if (row.status === "investigating") {
        investigatingCount += 1;
      } else if (row.status === "resolved") {
        resolvedCount += 1;
      }

      if (
        (row.status === "open" || row.status === "investigating") &&
        row.severity === "critical"
      ) {
        criticalCount += 1;
      }

      if (row.resolved_at) {
        resolutionDurationsMs.push(
          new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime(),
        );
      }
    }

    const activeTotal = openCount + investigatingCount + resolvedCount;
    const resolvedPercent =
      activeTotal > 0 ? Math.round((resolvedCount / activeTotal) * 100) : 0;

    const mttrHours =
      resolutionDurationsMs.length > 0
        ? Math.round(
            resolutionDurationsMs.reduce((sum, value) => sum + value, 0) /
              resolutionDurationsMs.length /
              (1000 * 60 * 60),
          )
        : null;

    return {
      openCount: openCount + investigatingCount,
      criticalCount,
      investigatingCount,
      resolvedCount,
      mttrHours,
      resolvedPercent,
    };
  } catch (error) {
    console.warn("[incidents] getIncidentSummary failed:", error);
    return EMPTY_INCIDENT_SUMMARY;
  }
}
