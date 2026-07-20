import { ensureDefaultEscalationRules } from "@/lib/escalation/defaults";
import type {
  EscalationDashboardMetrics,
  EscalationTriggerType,
  RecentEscalationItem,
} from "@/lib/escalation/types";
import { ESCALATION_RULE_SELECT, ESCALATION_TRIGGER_LABELS } from "@/lib/escalation/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { EscalationRule } from "@/types/database";

function resolveEntityHref(entityType: string, entityId: string): string {
  switch (entityType) {
    case "risk":
      return `/risks/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    case "report":
      return "/reports/schedules";
    case "client":
      return `/clients/${entityId}`;
    default:
      return "/activity";
  }
}

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

/** List escalation rules for the signed-in organization. */
export async function listEscalationRules(session: SessionContext): Promise<EscalationRule[]> {
  await ensureDefaultEscalationRules(session.organization.id);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("escalation_rules")
    .select(ESCALATION_RULE_SELECT)
    .eq("organization_id", session.organization.id)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as EscalationRule[]) ?? [];
}

/** Fetch a single escalation rule scoped to the organization. */
export async function getEscalationRuleById(
  session: SessionContext,
  ruleId: string,
): Promise<EscalationRule | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("escalation_rules")
    .select(ESCALATION_RULE_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("id", ruleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as EscalationRule | null) ?? null;
}

/** Dashboard metrics for escalation overview and recent widget. */
export async function getEscalationDashboardMetrics(
  session: SessionContext,
): Promise<EscalationDashboardMetrics> {
  const admin = createAdminClient();
  const organizationId = session.organization.id;
  const todayStart = startOfTodayIso();

  const [rulesResult, todayResult, recentExecutionsResult, acknowledgedResult] = await Promise.all([
    admin
      .from("escalation_rules")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("enabled", true),
    admin
      .from("escalation_executions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("executed_at", todayStart),
    admin
      .from("escalation_executions")
      .select(
        "id, escalation_rule_id, trigger_type, entity_type, entity_id, executed_at, escalation_rules ( name )",
      )
      .eq("organization_id", organizationId)
      .order("executed_at", { ascending: false })
      .limit(8),
    admin
      .from("activity_events")
      .select("entity_type, entity_id, metadata")
      .eq("organization_id", organizationId)
      .eq("action", "escalation_acknowledged"),
  ]);

  if (rulesResult.error) {
    throw new Error(rulesResult.error.message);
  }

  if (todayResult.error) {
    throw new Error(todayResult.error.message);
  }

  if (recentExecutionsResult.error) {
    throw new Error(recentExecutionsResult.error.message);
  }

  const recentExecutions = (recentExecutionsResult.data ?? []) as {
    id: string;
    escalation_rule_id: string;
    trigger_type: EscalationTriggerType;
    entity_type: string;
    entity_id: string;
    executed_at: string;
    escalation_rules: { name: string } | null;
  }[];

  const acknowledgedKeys = new Set(
    ((acknowledgedResult.data ?? []) as {
      entity_type: string;
      entity_id: string;
      metadata: { escalationRuleId?: string } | null;
    }[]).map((row) => `${row.metadata?.escalationRuleId ?? ""}:${row.entity_type}:${row.entity_id}`),
  );

  const entityTitles = await resolveEntityTitles(
    organizationId,
    recentExecutions.map((row) => ({ entityType: row.entity_type, entityId: row.entity_id })),
  );

  const clientNames = await resolveClientNamesForExecutions(organizationId, recentExecutions);

  const recentEscalations: RecentEscalationItem[] = recentExecutions.map((row) => {
    const ruleName = row.escalation_rules?.name ?? "Escalation rule";
    const ackKey = `${row.escalation_rule_id}:${row.entity_type}:${row.entity_id}`;
    const entityTitle =
      entityTitles.get(`${row.entity_type}:${row.entity_id}`) ?? "Operational item";

    return {
      id: row.id,
      entityType: row.entity_type as RecentEscalationItem["entityType"],
      entityId: row.entity_id,
      entityTitle,
      triggerType: row.trigger_type,
      ruleName,
      clientName: clientNames.get(row.entity_id) ?? null,
      executedAt: row.executed_at,
      status: acknowledgedKeys.has(ackKey) ? "acknowledged" : "escalated",
      href: resolveEntityHref(row.entity_type, row.entity_id),
    };
  });

  const { data: allExecutionsData, error: allExecutionsError } = await admin
    .from("escalation_executions")
    .select("escalation_rule_id, entity_type, entity_id")
    .eq("organization_id", organizationId);

  if (allExecutionsError) {
    throw new Error(allExecutionsError.message);
  }

  const outstandingCount = ((allExecutionsData ?? []) as {
    escalation_rule_id: string;
    entity_type: string;
    entity_id: string;
  }[]).filter(
    (row) => !acknowledgedKeys.has(`${row.escalation_rule_id}:${row.entity_type}:${row.entity_id}`),
  ).length;

  return {
    activeRulesCount: rulesResult.count ?? 0,
    escalationsTodayCount: todayResult.count ?? 0,
    outstandingCount,
    recentEscalations,
  };
}

async function resolveEntityTitles(
  organizationId: string,
  items: { entityType: string; entityId: string }[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const admin = createAdminClient();

  const riskIds = items.filter((item) => item.entityType === "risk").map((item) => item.entityId);
  const incidentIds = items
    .filter((item) => item.entityType === "incident")
    .map((item) => item.entityId);
  const reportScheduleIds = items
    .filter((item) => item.entityType === "report")
    .map((item) => item.entityId);

  const [risks, incidents, schedules] = await Promise.all([
    riskIds.length
      ? admin
          .from("client_risks")
          .select("id, title")
          .eq("organization_id", organizationId)
          .in("id", riskIds)
      : Promise.resolve({ data: [] }),
    incidentIds.length
      ? admin
          .from("incidents")
          .select("id, title")
          .eq("organization_id", organizationId)
          .in("id", incidentIds)
      : Promise.resolve({ data: [] }),
    reportScheduleIds.length
      ? admin
          .from("report_schedules")
          .select("id, title_template")
          .eq("organization_id", organizationId)
          .in("id", reportScheduleIds)
      : Promise.resolve({ data: [] }),
  ]);

  for (const row of (risks.data ?? []) as { id: string; title: string }[]) {
    map.set(`risk:${row.id}`, row.title);
  }

  for (const row of (incidents.data ?? []) as { id: string; title: string }[]) {
    map.set(`incident:${row.id}`, row.title);
  }

  for (const row of (schedules.data ?? []) as { id: string; title_template: string }[]) {
    map.set(`report:${row.id}`, row.title_template);
  }

  return map;
}

async function resolveClientNamesForExecutions(
  organizationId: string,
  executions: { entity_type: string; entity_id: string }[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const admin = createAdminClient();

  const riskIds = executions.filter((row) => row.entity_type === "risk").map((row) => row.entity_id);
  const incidentIds = executions
    .filter((row) => row.entity_type === "incident")
    .map((row) => row.entity_id);
  const scheduleIds = executions
    .filter((row) => row.entity_type === "report")
    .map((row) => row.entity_id);

  const [risks, incidents, schedules] = await Promise.all([
    riskIds.length
      ? admin.from("client_risks").select("id, clients ( name )").eq("organization_id", organizationId).in("id", riskIds)
      : Promise.resolve({ data: [] }),
    incidentIds.length
      ? admin
          .from("incidents")
          .select("id, clients ( name )")
          .eq("organization_id", organizationId)
          .in("id", incidentIds)
      : Promise.resolve({ data: [] }),
    scheduleIds.length
      ? admin
          .from("report_schedules")
          .select("id, clients ( name )")
          .eq("organization_id", organizationId)
          .in("id", scheduleIds)
      : Promise.resolve({ data: [] }),
  ]);

  for (const row of (risks.data ?? []) as { id: string; clients: { name: string } | null }[]) {
    map.set(row.id, row.clients?.name ?? null);
  }

  for (const row of (incidents.data ?? []) as { id: string; clients: { name: string } | null }[]) {
    map.set(row.id, row.clients?.name ?? null);
  }

  for (const row of (schedules.data ?? []) as { id: string; clients: { name: string } | null }[]) {
    map.set(row.id, row.clients?.name ?? null);
  }

  return map;
}

export { ESCALATION_TRIGGER_LABELS };
