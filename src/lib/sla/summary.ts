import { createClient } from "@/lib/supabase/server";
import { computeSlaMetrics } from "@/lib/sla/metrics";
import { buildSlaTimers } from "@/lib/sla/timers";
import { resolveSeverityTargets, formatSeverityTarget } from "@/lib/sla/policies";
import { getClientSlaAssignment, getDefaultSlaPolicy } from "@/lib/sla/queries";
import type {
  ClientSlaSummary,
  PortalSlaSummary,
  SlaActivityView,
  SlaEventView,
} from "@/lib/sla/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { IncidentSeverity } from "@/types/database";

const SLA_EVENT_SELECT = `
  id,
  organization_id,
  incident_id,
  client_id,
  policy_id,
  status,
  breached,
  started_at,
  response_due_at,
  resolution_due_at,
  responded_at,
  resolved_at,
  created_at,
  updated_at
`;

const SLA_ACTIVITY_SELECT = `
  id,
  organization_id,
  event_type,
  actor_user_id,
  incident_id,
  message,
  metadata,
  created_at
`;

/** Client-level SLA summary for detail pages and reports. */
export async function getClientSLA(
  session: SessionContext,
  clientId: string,
): Promise<ClientSlaSummary> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;

    const [{ data: clientRow }, eventsResult, activityResult] = await Promise.all([
      supabase
        .from("clients")
        .select("sla_policy_id")
        .eq("organization_id", organizationId)
        .eq("id", clientId)
        .maybeSingle(),
      supabase
        .from("sla_events")
        .select(
          "breached, responded_at, resolved_at, started_at, response_due_at, resolution_due_at, status, created_at",
        )
        .eq("organization_id", organizationId)
        .eq("client_id", clientId),
      supabase
        .from("sla_activity")
        .select(SLA_ACTIVITY_SELECT)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const assignedPolicyId =
      (clientRow as { sla_policy_id: string | null } | null)?.sla_policy_id ?? null;
    const clientAssignment = await getClientSlaAssignment(organizationId, assignedPolicyId);

    const eventRows =
      (eventsResult.data ?? []) as Array<{
        breached: boolean;
        responded_at: string | null;
        resolved_at: string | null;
        started_at: string | null;
        response_due_at: string | null;
        resolution_due_at: string | null;
        status: string;
        created_at: string;
      }>;

    const metrics = computeSlaMetrics(eventRows);
    const openEvents = await supabase
      .from("sla_events")
      .select(SLA_EVENT_SELECT)
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .is("resolved_at", null)
      .neq("status", "completed")
      .limit(5);

    const activeTimers = ((openEvents.data ?? []) as SlaEventView[]).flatMap((event) =>
      buildSlaTimers(event),
    );

    return {
      policyName: clientAssignment.effectivePolicy?.name ?? null,
      compliancePercent: metrics.compliancePercent,
      breachCount: metrics.breachedCount,
      avgResponseMinutes: metrics.avgResponseMinutes,
      avgResolutionMinutes: metrics.avgResolutionMinutes,
      activeTimers,
      recentActivity: (activityResult.data ?? []) as SlaActivityView[],
      assignment: clientAssignment,
    };
  } catch (error) {
    console.warn("[sla] getClientSLA failed:", error);
    return EMPTY_CLIENT_SLA_SUMMARY;
  }
}

/** Portal-safe SLA summary without internal timers. */
export async function getPortalSlaSummary(
  session: SessionContext,
  assignedPolicyId: string | null,
  clientId: string,
): Promise<PortalSlaSummary> {
  try {
    const organizationId = session.organization.id;
    const assignment = await getClientSlaAssignment(organizationId, assignedPolicyId);
    const clientMetrics = await getClientSLA(session, clientId);
    const policy = assignment.effectivePolicy;
    const mediumTargets = resolveSeverityTargets(policy, "medium");

    return {
      policyName: policy?.name ?? null,
      compliancePercent: clientMetrics.compliancePercent,
      responseTarget: formatSeverityTarget(mediumTargets.responseMinutes),
      resolutionTarget: formatSeverityTarget(mediumTargets.resolutionMinutes),
      breachCount: clientMetrics.breachCount,
    };
  } catch (error) {
    console.warn("[sla] getPortalSlaSummary failed:", error);
    return {
      policyName: null,
      compliancePercent: 100,
      responseTarget: "—",
      resolutionTarget: "—",
      breachCount: 0,
    };
  }
}

export async function listSlaActivityForPolicy(
  session: SessionContext,
  policyId: string,
  limit = 20,
): Promise<SlaActivityView[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_activity")
      .select(SLA_ACTIVITY_SELECT)
      .eq("organization_id", session.organization.id)
      .contains("metadata", { policyId })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[sla] listSlaActivityForPolicy failed:", error.message);
      return [];
    }

    return (data ?? []) as SlaActivityView[];
  } catch (error) {
    console.warn("[sla] listSlaActivityForPolicy failed:", error);
    return [];
  }
}

export async function listSlaBreachHistory(
  session: SessionContext,
  options: { clientId?: string; policyId?: string; limit?: number } = {},
): Promise<SlaEventView[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("sla_events")
      .select(SLA_EVENT_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("breached", true)
      .order("created_at", { ascending: false })
      .limit(options.limit ?? 10);

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.policyId) {
      query = query.eq("policy_id", options.policyId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[sla] listSlaBreachHistory failed:", error.message);
      return [];
    }

    return (data ?? []) as SlaEventView[];
  } catch (error) {
    console.warn("[sla] listSlaBreachHistory failed:", error);
    return [];
  }
}

export async function getTopBreachedClients(
  session: SessionContext,
  limit = 5,
): Promise<Array<{ clientId: string; breachCount: number }>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_events")
      .select("client_id")
      .eq("organization_id", session.organization.id)
      .eq("breached", true)
      .not("client_id", "is", null);

    if (error) {
      console.warn("[sla] getTopBreachedClients failed:", error.message);
      return [];
    }

    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ client_id: string | null }>) {
      if (!row.client_id) {
        continue;
      }
      counts.set(row.client_id, (counts.get(row.client_id) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([clientId, breachCount]) => ({ clientId, breachCount }))
      .sort((left, right) => right.breachCount - left.breachCount)
      .slice(0, limit);
  } catch (error) {
    console.warn("[sla] getTopBreachedClients failed:", error);
    return [];
  }
}

const EMPTY_CLIENT_SLA_SUMMARY: ClientSlaSummary = {
  policyName: null,
  compliancePercent: 100,
  breachCount: 0,
  avgResponseMinutes: null,
  avgResolutionMinutes: null,
  activeTimers: [],
  recentActivity: [],
  assignment: {
    assignedPolicyId: null,
    effectivePolicy: null,
    source: "none",
  },
};

export function formatSlaMinutes(minutes: number | null | undefined): string {
  if (minutes == null) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} h`;
}

export function resolvePortalTargetsForSeverity(
  policy: Awaited<ReturnType<typeof getDefaultSlaPolicy>>,
  severity: IncidentSeverity = "medium",
) {
  const targets = resolveSeverityTargets(policy, severity);
  return {
    responseTarget: formatSeverityTarget(targets.responseMinutes),
    resolutionTarget: formatSeverityTarget(targets.resolutionMinutes),
  };
}
