import type { SessionContext } from "@/lib/tenancy/context";
import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import { createClient } from "@/lib/supabase/server";
import {
  CUSTOMER_FACING_EVENT_TYPES,
  MEANINGFUL_ACTIVITY_EVENT_TYPES,
} from "@/lib/adoption/constants";
import type { AdoptionDataSnapshot } from "@/lib/adoption/types";

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function countRows(
  table: string,
  organizationId: string,
  filter?: { column: string; value: string | boolean | number },
  since?: string,
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  if (since) {
    query = query.gte("created_at", since);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function countActivityEvents(
  organizationId: string,
  eventTypes: readonly string[],
  since: string,
): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("event_type", [...eventTypes])
    .gte("created_at", since);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

async function getLastMeaningfulActivityAt(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("organization_id", organizationId)
    .in("event_type", [...MEANINGFUL_ACTIVITY_EVENT_TYPES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return (data as { created_at: string }).created_at;
}

async function countDistinctActiveUsers(organizationId: string, since: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("actor_user_id")
    .eq("organization_id", organizationId)
    .gte("created_at", since)
    .not("actor_user_id", "is", null);

  if (error || !data) {
    return 0;
  }

  const unique = new Set(
    (data as { actor_user_id: string | null }[])
      .map((row) => row.actor_user_id)
      .filter(Boolean),
  );
  return unique.size;
}

async function countDistinctActiveWeeks(organizationId: string, since: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("created_at")
    .eq("organization_id", organizationId)
    .in("event_type", [...MEANINGFUL_ACTIVITY_EVENT_TYPES])
    .gte("created_at", since);

  if (error || !data) {
    return 0;
  }

  const weeks = new Set<string>();
  for (const row of data as { created_at: string }[]) {
    const date = new Date(row.created_at);
    const weekKey = `${date.getUTCFullYear()}-W${Math.floor(date.getUTCDate() / 7)}-${date.getUTCMonth()}`;
    weeks.add(weekKey);
  }
  return weeks.size;
}

function knowledgeCount(knowledgeHub: KnowledgeHubData | null): number {
  if (!knowledgeHub) {
    return 0;
  }
  return (
    knowledgeHub.articles.length +
    knowledgeHub.playbooks.length +
    knowledgeHub.publishedReports.length
  );
}

async function countOpenIncidents(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", ["open", "investigating"]);
  if (error) {
    return 0;
  }
  return count ?? 0;
}

export type AdoptionQueryInput = {
  session: SessionContext;
  planContext: OrganizationPlanContext | null;
  teamMemberCount: number;
  pendingInvitationCount: number;
  knowledgeHub: KnowledgeHubData | null;
  openRiskCount?: number;
  monitoringConnectorCount?: number;
};

/** Parallel bounded queries for adoption metrics — organization-scoped. */
export async function getAdoptionDataSnapshot(
  input: AdoptionQueryInput,
): Promise<AdoptionDataSnapshot> {
  const organizationId = input.session.organization.id;
  const features = input.planContext?.features;
  const since30d = daysAgoIso(30);
  const since60d = daysAgoIso(60);

  const [
    clientCount,
    reportCount,
    publishedReportCount,
    publishedReports30d,
    reportScheduleCount,
    activeScheduleCount,
    riskCount,
    incidentCount,
    openIncidentCount,
    portalUserCount,
    slaPolicyCount,
    profitabilityRecordCount,
    automationWorkflowCount,
    automationExecutions30d,
    monitoringEvents30d,
    valueEvents30d,
    valueEvents60d,
    customerFacingEvents30d,
    lastMeaningfulActivityAt,
    activeUsers30d,
    distinctActiveWeeks30d,
    monitoringConnectorCount,
  ] = await Promise.all([
    countRows("clients", organizationId),
    countRows("reports", organizationId),
    countRows("reports", organizationId, { column: "status", value: "published" }),
    countRows("reports", organizationId, { column: "status", value: "published" }, since30d),
    features?.report_scheduling
      ? countRows("report_schedules", organizationId)
      : Promise.resolve(0),
    features?.report_scheduling
      ? countRows("report_schedules", organizationId, { column: "is_active", value: true })
      : Promise.resolve(0),
    features?.risks ? countRows("risks", organizationId) : Promise.resolve(0),
    features?.incidents ? countRows("incidents", organizationId) : Promise.resolve(0),
    features?.incidents ? countOpenIncidents(organizationId) : Promise.resolve(0),
    features?.customer_portal
      ? countRows("client_portal_users", organizationId)
      : Promise.resolve(0),
    features?.sla_tracking
      ? countRows("sla_policies", organizationId)
      : Promise.resolve(0),
    features?.profitability
      ? countRows("client_financials", organizationId)
      : Promise.resolve(0),
    features?.automation_engine
      ? countRows("automation_workflows", organizationId)
      : Promise.resolve(0),
    features?.automation_engine
      ? countRows("automation_executions", organizationId, undefined, since30d)
      : Promise.resolve(0),
    countRows("monitoring_events", organizationId, undefined, since30d),
    countActivityEvents(organizationId, MEANINGFUL_ACTIVITY_EVENT_TYPES, since30d),
    countActivityEvents(organizationId, MEANINGFUL_ACTIVITY_EVENT_TYPES, since60d),
    countActivityEvents(organizationId, CUSTOMER_FACING_EVENT_TYPES, since30d),
    getLastMeaningfulActivityAt(organizationId),
    countDistinctActiveUsers(organizationId, since30d),
    countDistinctActiveWeeks(organizationId, since30d),
    input.monitoringConnectorCount ?? countRows("monitoring_connectors", organizationId),
  ]);

  const valueEventsPrevious30d = Math.max(0, valueEvents60d - valueEvents30d);

  return {
    clientCount,
    reportCount,
    publishedReportCount,
    publishedReports30d,
    reportScheduleCount,
    activeScheduleCount,
    riskCount,
    openRiskCount: input.openRiskCount ?? 0,
    incidentCount,
    openIncidentCount,
    monitoringConnectorCount,
    monitoringEvents30d,
    automationWorkflowCount,
    automationExecutions30d,
    knowledgeItemCount: knowledgeCount(input.knowledgeHub),
    teamMemberCount: input.teamMemberCount || 1,
    pendingInvitationCount: input.pendingInvitationCount,
    portalUserCount,
    slaPolicyCount,
    profitabilityRecordCount,
    valueEvents30d,
    valueEventsPrevious30d,
    lastMeaningfulActivityAt,
    activeUsers30d,
    totalUsers: input.teamMemberCount || 1,
    distinctActiveWeeks30d,
    customerFacingEvents30d,
    features: {
      risks: features?.risks ?? false,
      incidents: features?.incidents ?? false,
      sla: features?.sla_tracking ?? false,
      customerPortal: features?.customer_portal ?? false,
      profitability: features?.profitability ?? false,
      scheduling: features?.report_scheduling ?? false,
      automation: features?.automation_engine ?? false,
      knowledge: features?.ai_knowledge_search ?? false,
      monitoring: true,
    },
  };
}

export function computeDaysSinceMeaningfulActivity(
  lastAt: string | null,
  now: Date = new Date(),
): number | null {
  if (!lastAt) {
    return null;
  }
  const last = new Date(lastAt);
  const diffMs = now.getTime() - last.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
