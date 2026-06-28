import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { CriticalIncidentAlert, IncidentWithRelations, RiskOption } from "@/lib/incidents/types";
import {
  INCIDENT_LIST_SELECT,
  INCIDENT_SELECT_COLUMNS,
  OPEN_INCIDENT_STATUSES,
} from "@/lib/incidents/types";

type ListIncidentsOptions = {
  includeArchived?: boolean;
};

/** List incidents for the current organization with related names. */
export async function listIncidents(
  session: SessionContext,
  options: ListIncidentsOptions = {},
): Promise<IncidentWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("incidents")
    .select(INCIDENT_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as IncidentWithRelations[];
}

/** Load a single incident by id within the current organization. */
export async function getIncidentById(
  session: SessionContext,
  incidentId: string,
): Promise<IncidentWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(INCIDENT_LIST_SELECT)
    .eq("id", incidentId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as IncidentWithRelations | null) ?? null;
}

/** Active risks available for optional incident linking. */
export async function listLinkableRisks(session: SessionContext): Promise<RiskOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select("id, title, client_id")
    .eq("organization_id", session.organization.id)
    .neq("status", "archived")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RiskOption[];
}

/** Dashboard metrics for open and critical incidents. */
export async function getIncidentDashboardMetrics(session: SessionContext): Promise<{
  openIncidentCount: number;
  criticalIncidents: CriticalIncidentAlert[];
}> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const { count, error: countError } = await supabase
    .from("incidents")
    .select(INCIDENT_SELECT_COLUMNS, { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", OPEN_INCIDENT_STATUSES);

  if (countError) {
    throw new Error(countError.message);
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
    throw new Error(error.message);
  }

  return {
    openIncidentCount: count ?? 0,
    criticalIncidents: (data ?? []) as CriticalIncidentAlert[],
  };
}
