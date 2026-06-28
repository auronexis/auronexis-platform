import "server-only";

import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import type { OperationalAIContext, OperationalEntityType } from "@/lib/ai/operational/types";
import { searchKnowledgeForOperational } from "@/lib/ai/knowledge/search";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
} from "@/lib/reports/queries";
import { getIncidentById } from "@/lib/incidents/queries";
import { getRiskById } from "@/lib/risks/queries";
import { getClientSlaAssignment, getIncidentSlaInfo, getRiskSlaInfo } from "@/lib/sla/queries";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import { getCurrentPlan } from "@/lib/plans/queries";
import { isFeatureEnabled } from "@/lib/plans/features";

type BuildContextInput = {
  entityType: OperationalEntityType;
  entityId?: string;
  clientId: string;
  title: string;
  description: string;
  resolutionNotes: string;
  severity: string;
  status: string;
  assigneeUserId?: string | null;
  dueDate?: string | null;
  linkedRiskId?: string | null;
  occurredAt?: string | null;
};

async function verifyClient(session: SessionContext, clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", session.organization.id)
    .eq("id", clientId)
    .maybeSingle();

  if (error || !data) throw new Error("access_denied");
  return data as { id: string; name: string };
}

async function listClientReports(session: SessionContext, clientId: string, limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, title, status")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Array<{ id: string; title: string; status: string }>;
}

async function listEntityActivity(
  session: SessionContext,
  entityType: OperationalEntityType,
  entityId: string,
  clientId: string,
  limit = 8,
): Promise<ActivityEventView[]> {
  const supabase = await createClient();
  const filters = [
    `and(entity_type.eq.client,entity_id.eq.${clientId})`,
    `and(entity_type.eq.${entityType},entity_id.eq.${entityId})`,
  ];

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", session.organization.id)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as ActivityEventView[];
}

/** Build trusted operational context from DB — never client-only. */
export async function buildTrustedOperationalContext(
  session: SessionContext,
  input: BuildContextInput,
): Promise<OperationalAIContext> {
  await verifyClient(session, input.clientId);

  let createdAt = new Date().toISOString();
  let updatedAt = createdAt;
  let assigneeName: string | null = null;
  let linkedRiskTitle: string | null = null;
  let slaBreached = false;
  let slaPolicyName: string | null = null;

  if (input.entityId) {
    if (input.entityType === "risk") {
      const risk = await getRiskById(session, input.entityId);
      if (!risk || risk.client_id !== input.clientId) throw new Error("access_denied");
      createdAt = risk.created_at;
      updatedAt = risk.updated_at;
      assigneeName = risk.users?.full_name ?? null;
      const sla = await getRiskSlaInfo(session, {
        client_id: risk.client_id,
        created_at: risk.created_at,
        status: risk.status,
        resolved_at: risk.resolved_at,
      });
      slaBreached = sla.status === "breached";
      slaPolicyName = sla.policyName;
    } else {
      const incident = await getIncidentById(session, input.entityId);
      if (!incident || incident.client_id !== input.clientId) throw new Error("access_denied");
      createdAt = incident.created_at;
      updatedAt = incident.updated_at;
      assigneeName = incident.users?.full_name ?? null;
      linkedRiskTitle = incident.risks?.title ?? null;
      const sla = await getIncidentSlaInfo(session, {
        client_id: incident.client_id,
        created_at: incident.created_at,
        status: incident.status,
        resolved_at: incident.resolved_at,
      });
      slaBreached = sla.status === "breached";
      slaPolicyName = sla.policyName;
    }
  } else {
    const assignment = await getClientSlaAssignment(session.organization.id, null);
    slaPolicyName = assignment.effectivePolicy?.name ?? null;
  }

  const client = await verifyClient(session, input.clientId);

  const [metrics, openRisks, openIncidents, reports, profitabilityRows, activity] =
    await Promise.all([
      getClientReportMetrics(session, input.clientId),
      getRelatedOpenRisks(session, input.clientId),
      getRelatedOpenIncidents(session, input.clientId),
      listClientReports(session, input.clientId),
      buildClientProfitabilityRows(session),
      input.entityId
        ? listEntityActivity(session, input.entityType, input.entityId, input.clientId)
        : Promise.resolve([]),
    ]);

  const profitability = profitabilityRows.find((row) => row.clientId === input.clientId);

  const planKey = await getCurrentPlan(session.organization.id);
  const knowledgeEnabled = isFeatureEnabled(planKey, "ai_knowledge_search");
  const knowledgeSnippets = knowledgeEnabled
    ? await searchKnowledgeForOperational(session, {
        clientId: input.clientId,
        entityType: input.entityType,
        title: input.title,
        description: `${input.description} ${input.resolutionNotes}`,
      })
    : [];

  return {
    entityType: input.entityType,
    entityId: input.entityId,
    clientId: client.id,
    clientName: client.name,
    title: input.title,
    description: input.description,
    resolutionNotes: input.resolutionNotes,
    severity: input.severity,
    status: input.status,
    assigneeName,
    createdAt,
    updatedAt,
    dueDate: input.dueDate ?? null,
    slaPolicyName,
    slaBreached,
    linkedRiskTitle,
    openRisks: openRisks.map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      status: r.status,
    })),
    openIncidents: openIncidents.map((i) => ({
      id: i.id,
      title: i.title,
      severity: i.severity,
      status: i.status,
    })),
    relatedReports: reports,
    recentActivity: activity.map((event) => ({
      id: event.id,
      title: event.title,
      action: event.action,
      createdAt: event.created_at,
    })),
    customerHealth: profitability?.health ?? null,
    profitabilityMargin: profitability?.margin ?? null,
    openRisksCount: metrics.openRisksCount,
    openIncidentsCount: metrics.openIncidentsCount,
    knowledgeSnippets,
  };
}
