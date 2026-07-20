import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { resolveEntitySlaInfo } from "@/lib/sla/calculations";
import {
  evaluateSlaTransitionsForEntity,
  resolvePolicyForClient,
} from "@/lib/sla/evaluations";
import type {
  ClientSlaAssignment,
  EntitySlaInfo,
  IncidentSlaView,
  SlaBreachAlertItem,
  SlaDashboardMetrics,
  SlaEventView,
} from "@/lib/sla/types";
import { SLA_EVENT_SELECT, SLA_POLICY_SELECT } from "@/lib/sla/types";
import { getSLAMetrics } from "@/lib/sla/metrics";
import { buildSlaTimers } from "@/lib/sla/timers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientRiskStatus, IncidentSeverity, IncidentStatus, RiskStatus, SlaPolicy } from "@/types/database";
import { cache } from "react";

type ClientPolicyRow = {
  id: string;
  sla_policy_id: string | null;
};

type OpenIncidentRow = {
  id: string;
  client_id: string;
  title: string;
  status: IncidentStatus;
  created_at: string;
  assigned_user_id: string | null;
  clients: { name: string; sla_policy_id: string | null } | null;
};

type OpenRiskRow = {
  id: string;
  client_id: string;
  title: string;
  status: RiskStatus;
  created_at: string;
  owner_user_id: string | null;
  clients: { name: string; sla_policy_id: string | null } | null;
};

/** List SLA policies for the signed-in organization. */
export async function listSlaPolicies(session: SessionContext): Promise<SlaPolicy[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sla_policies")
    .select(SLA_POLICY_SELECT)
    .eq("organization_id", session.organization.id)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlaPolicy[]) ?? [];
}

/** Fetch a single SLA policy scoped to the organization. */
export async function getSlaPolicyById(
  session: SessionContext,
  policyId: string,
): Promise<SlaPolicy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sla_policies")
    .select(SLA_POLICY_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("id", policyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlaPolicy | null) ?? null;
}

/** Fetch the default SLA policy for an organization. */
export async function getDefaultSlaPolicy(organizationId: string): Promise<SlaPolicy | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sla_policies")
    .select(SLA_POLICY_SELECT)
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SlaPolicy | null) ?? null;
}

async function listClientPolicyRows(
  organizationId: string,
  clientIds: string[],
): Promise<ClientPolicyRow[]> {
  if (clientIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const uniqueClientIds = [...new Set(clientIds)];
  const { data, error } = await supabase
    .from("clients")
    .select("id, sla_policy_id")
    .eq("organization_id", organizationId)
    .in("id", uniqueClientIds);

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClientPolicyRow[]) ?? [];
}

/** Resolve effective SLA policy per client id. */
export async function getClientSlaPolicyMap(
  organizationId: string,
  clientIds: string[],
): Promise<Map<string, SlaPolicy | null>> {
  const map = new Map<string, SlaPolicy | null>();

  if (clientIds.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const [clients, defaultPolicy] = await Promise.all([
    listClientPolicyRows(organizationId, clientIds),
    getDefaultSlaPolicy(organizationId),
  ]);

  const policyIds = [
    ...new Set(
      clients
        .map((client) => client.sla_policy_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  let policiesById = new Map<string, SlaPolicy>();

  if (policyIds.length > 0 || defaultPolicy) {
    const idsToFetch = [...policyIds];
    if (defaultPolicy && !idsToFetch.includes(defaultPolicy.id)) {
      idsToFetch.push(defaultPolicy.id);
    }

    if (idsToFetch.length > 0) {
      const { data: policiesData, error: policiesError } = await supabase
        .from("sla_policies")
        .select(SLA_POLICY_SELECT)
        .eq("organization_id", organizationId)
        .in("id", idsToFetch);

      if (policiesError) {
        throw new Error(policiesError.message);
      }

      policiesById = new Map(
        ((policiesData as SlaPolicy[]) ?? []).map((policy) => [policy.id, policy]),
      );
    }
  }

  for (const client of clients) {
    const assignedPolicy = client.sla_policy_id
      ? policiesById.get(client.sla_policy_id) ?? null
      : null;
    map.set(client.id, assignedPolicy ?? defaultPolicy);
  }

  return map;
}

type ClientSlaContext = {
  policy: SlaPolicy | null;
  assignedPolicyId: string | null;
};

async function getClientSlaContextMap(
  organizationId: string,
  clientIds: string[],
): Promise<Map<string, ClientSlaContext>> {
  const map = new Map<string, ClientSlaContext>();

  if (clientIds.length === 0) {
    return map;
  }

  const supabase = await createClient();
  const [clients, defaultPolicy] = await Promise.all([
    listClientPolicyRows(organizationId, clientIds),
    getDefaultSlaPolicy(organizationId),
  ]);
  const policyIds = [
    ...new Set(
      clients
        .map((client) => client.sla_policy_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  let policiesById = new Map<string, SlaPolicy>();

  if (policyIds.length > 0 || defaultPolicy) {
    const idsToFetch = [...policyIds];
    if (defaultPolicy && !idsToFetch.includes(defaultPolicy.id)) {
      idsToFetch.push(defaultPolicy.id);
    }

    if (idsToFetch.length > 0) {
      const { data: policiesData, error: policiesError } = await supabase
        .from("sla_policies")
        .select(SLA_POLICY_SELECT)
        .eq("organization_id", organizationId)
        .in("id", idsToFetch);

      if (policiesError) {
        throw new Error(policiesError.message);
      }

      policiesById = new Map(
        ((policiesData as SlaPolicy[]) ?? []).map((policy) => [policy.id, policy]),
      );
    }
  }

  for (const client of clients) {
    const assignedPolicyId = client.sla_policy_id;
    const assignedPolicy = assignedPolicyId
      ? policiesById.get(assignedPolicyId) ?? null
      : null;

    map.set(client.id, {
      assignedPolicyId,
      policy: assignedPolicy ?? defaultPolicy,
    });
  }

  return map;
}

/** Resolve a client's effective SLA assignment for display. */
export async function getClientSlaAssignment(
  organizationId: string,
  assignedPolicyId: string | null,
): Promise<ClientSlaAssignment> {
  const defaultPolicy = await getDefaultSlaPolicy(organizationId);

  if (assignedPolicyId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_policies")
      .select(SLA_POLICY_SELECT)
      .eq("organization_id", organizationId)
      .eq("id", assignedPolicyId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const policy = (data as SlaPolicy | null) ?? null;

    return {
      assignedPolicyId,
      effectivePolicy: policy ?? defaultPolicy,
      source: "assigned",
    };
  }

  if (defaultPolicy) {
    return {
      assignedPolicyId: null,
      effectivePolicy: defaultPolicy,
      source: "inherited",
    };
  }

  return {
    assignedPolicyId: null,
    effectivePolicy: null,
    source: "none",
  };
}

export async function attachIncidentSlaInfo<
  T extends {
    client_id: string;
    created_at: string;
    status: IncidentStatus;
    resolved_at?: string | null;
  },
>(organizationId: string, incidents: T[]): Promise<Array<T & { sla: EntitySlaInfo }>> {
  const contextMap = await getClientSlaContextMap(
    organizationId,
    incidents.map((incident) => incident.client_id),
  );

  return incidents.map((incident) => {
    const context = contextMap.get(incident.client_id);

    return {
      ...incident,
      sla: resolveEntitySlaInfo({
        entityType: "incident",
        createdAt: incident.created_at,
        status: incident.status,
        policy: context?.policy ?? null,
        assignedPolicyId: context?.assignedPolicyId ?? null,
        resolvedAt: incident.resolved_at ?? null,
      }),
    };
  });
}

export async function attachRiskSlaInfo<
  T extends {
    client_id: string;
    created_at: string;
    status: RiskStatus;
    resolved_at?: string | null;
  },
>(organizationId: string, risks: T[]): Promise<Array<T & { sla: EntitySlaInfo }>> {
  const contextMap = await getClientSlaContextMap(
    organizationId,
    risks.map((risk) => risk.client_id),
  );

  return risks.map((risk) => {
    const context = contextMap.get(risk.client_id);

    return {
      ...risk,
      sla: resolveEntitySlaInfo({
        entityType: "risk",
        createdAt: risk.created_at,
        status: risk.status,
        policy: context?.policy ?? null,
        assignedPolicyId: context?.assignedPolicyId ?? null,
        resolvedAt: risk.resolved_at ?? null,
      }),
    };
  });
}

const loadOpenSlaEntities = cache(async function loadOpenSlaEntities(organizationId: string): Promise<{
  defaultPolicy: SlaPolicy | null;
  incidents: OpenIncidentRow[];
  risks: OpenRiskRow[];
  policiesById: Map<string, SlaPolicy>;
}> {
  const admin = createAdminClient();

  const [defaultPolicy, incidentsResult, risksResult] = await Promise.all([
    getDefaultSlaPolicy(organizationId),
    admin
      .from("incidents")
      .select(
        "id, client_id, title, status, created_at, assigned_user_id, clients ( name, sla_policy_id )",
      )
      .eq("organization_id", organizationId)
      .in("status", OPEN_INCIDENT_STATUSES),
    admin
      .from("client_risks")
      .select(
        "id, client_id, title, status, created_at, owner_user_id, clients ( name, sla_policy_id )",
      )
      .eq("organization_id", organizationId)
      .in("status", OPEN_RISK_STATUSES),
  ]);

  if (incidentsResult.error || risksResult.error) {
    throw new Error("Unable to load SLA entities.");
  }

  const incidents = (incidentsResult.data as OpenIncidentRow[]) ?? [];
  const risks = (risksResult.data as OpenRiskRow[]) ?? [];

  const policyIds = new Set<string>();
  for (const incident of incidents) {
    if (incident.clients?.sla_policy_id) {
      policyIds.add(incident.clients.sla_policy_id);
    }
  }
  for (const risk of risks) {
    if (risk.clients?.sla_policy_id) {
      policyIds.add(risk.clients.sla_policy_id);
    }
  }

  let policiesById = new Map<string, SlaPolicy>();
  const idsToFetch = [...policyIds];
  if (defaultPolicy && !idsToFetch.includes(defaultPolicy.id)) {
    idsToFetch.push(defaultPolicy.id);
  }

  if (idsToFetch.length > 0) {
    const { data, error } = await admin
      .from("sla_policies")
      .select(SLA_POLICY_SELECT)
      .eq("organization_id", organizationId)
      .in("id", idsToFetch);

    if (error) {
      throw new Error(error.message);
    }

    policiesById = new Map(((data as SlaPolicy[]) ?? []).map((policy) => [policy.id, policy]));
  }

  return { defaultPolicy, incidents, risks, policiesById };
});

/** Evaluate open items and dispatch SLA automations only on status transitions. */
export async function processOrganizationSlaAlerts(organizationId: string): Promise<void> {
  const { defaultPolicy, incidents, risks, policiesById } = await loadOpenSlaEntities(organizationId);

  for (const incident of incidents) {
    const policy = await resolvePolicyForClient(
      incident.clients?.sla_policy_id ?? null,
      policiesById,
      defaultPolicy,
    );

    await evaluateSlaTransitionsForEntity(organizationId, {
      entityType: "incident",
      entityId: incident.id,
      clientId: incident.client_id,
      title: incident.title,
      clientName: incident.clients?.name ?? null,
      createdAt: incident.created_at,
      assignedUserId: incident.assigned_user_id,
      clientSlaPolicyId: incident.clients?.sla_policy_id ?? null,
      policyHours: policy?.incident_hours ?? null,
    });
  }

  for (const risk of risks) {
    const policy = await resolvePolicyForClient(
      risk.clients?.sla_policy_id ?? null,
      policiesById,
      defaultPolicy,
    );

    await evaluateSlaTransitionsForEntity(organizationId, {
      entityType: "risk",
      entityId: risk.id,
      clientId: risk.client_id,
      title: risk.title,
      clientName: risk.clients?.name ?? null,
      createdAt: risk.created_at,
      assignedUserId: risk.owner_user_id,
      clientSlaPolicyId: risk.clients?.sla_policy_id ?? null,
      policyHours: policy?.risk_hours ?? null,
    });
  }
}

/** Dashboard SLA metrics — counts and prioritized breach lists. */
export async function getSlaDashboardMetrics(session: SessionContext): Promise<SlaDashboardMetrics> {
  const organizationId = session.organization.id;
  const now = new Date();
  const { defaultPolicy, incidents, risks, policiesById } = await loadOpenSlaEntities(organizationId);

  const alerts: SlaBreachAlertItem[] = [];
  let breachedCount = 0;
  let warningCount = 0;
  let onTrackCount = 0;

  const collectAlert = (
    entityType: "incident" | "risk",
    item: OpenIncidentRow | OpenRiskRow,
    client: OpenIncidentRow["clients"],
  ) => {
    const policy = client?.sla_policy_id
      ? policiesById.get(client.sla_policy_id) ?? defaultPolicy
      : defaultPolicy;

    const sla = resolveEntitySlaInfo({
      entityType,
      createdAt: item.created_at,
      status: item.status,
      policy,
      assignedPolicyId: client?.sla_policy_id ?? null,
      now,
    });

    if (!sla.status || !sla.slaDueAt) {
      return;
    }

    if (sla.status === "breached") {
      breachedCount += 1;
    } else if (sla.status === "warning") {
      warningCount += 1;
    } else {
      onTrackCount += 1;
    }

    alerts.push({
      entityType,
      id: item.id,
      title: item.title,
      clientName: client?.name ?? null,
      dueAt: sla.slaDueAt,
      status: sla.status,
      href: entityType === "incident" ? `/incidents/${item.id}` : `/risks/${item.id}`,
    });
  };

  for (const incident of incidents) {
    collectAlert("incident", incident, incident.clients);
  }

  for (const risk of risks) {
    collectAlert("risk", risk, risk.clients);
  }

  alerts.sort(
    (left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime(),
  );

  const breachedItems = alerts.filter((item) => item.status === "breached");
  const upcomingBreaches = alerts.filter((item) => item.status !== "breached").slice(0, 5);
  const v2Metrics = await getSLAMetrics(session).catch(() => null);

  return {
    breachedCount: v2Metrics?.breachedCount ?? breachedCount,
    warningCount,
    onTrackCount,
    upcomingBreaches,
    breachedItems: breachedItems.slice(0, 5),
    compliancePercent: v2Metrics?.compliancePercent ?? 100,
    avgResponseMinutes: v2Metrics?.avgResponseMinutes ?? null,
    avgResolutionMinutes: v2Metrics?.avgResolutionMinutes ?? null,
    criticalBreaches: v2Metrics?.criticalBreaches ?? breachedCount,
    openTimers: v2Metrics?.openTimers ?? onTrackCount + warningCount,
    monthlyTrend: v2Metrics?.monthlyTrend ?? [],
  };
}

/** Resolve SLA info for a single incident detail view. */
export async function getIncidentSlaInfo(
  session: SessionContext,
  incident: {
    client_id: string;
    created_at: string;
    status: IncidentStatus;
    resolved_at?: string | null;
  },
): Promise<EntitySlaInfo> {
  const contextMap = await getClientSlaContextMap(session.organization.id, [incident.client_id]);
  const context = contextMap.get(incident.client_id);

  return resolveEntitySlaInfo({
    entityType: "incident",
    createdAt: incident.created_at,
    status: incident.status,
    policy: context?.policy ?? null,
    assignedPolicyId: context?.assignedPolicyId ?? null,
    resolvedAt: incident.resolved_at ?? null,
  });
}

export async function getRiskSlaInfo(
  session: SessionContext,
  risk: {
    client_id: string;
    created_at: string;
    status: ClientRiskStatus | RiskStatus;
    resolved_at?: string | null;
  },
): Promise<EntitySlaInfo> {
  const contextMap = await getClientSlaContextMap(session.organization.id, [risk.client_id]);
  const context = contextMap.get(risk.client_id);

  return resolveEntitySlaInfo({
    entityType: "risk",
    createdAt: risk.created_at,
    status: risk.status,
    policy: context?.policy ?? null,
    assignedPolicyId: context?.assignedPolicyId ?? null,
    resolvedAt: risk.resolved_at ?? null,
  });
}

export const getSLAPolicies = listSlaPolicies;

export async function getSlaEventByIncidentId(
  organizationId: string,
  incidentId: string,
): Promise<SlaEventView | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_events")
      .select(SLA_EVENT_SELECT)
      .eq("organization_id", organizationId)
      .eq("incident_id", incidentId)
      .maybeSingle();

    if (error) {
      console.warn("[sla] getSlaEventByIncidentId failed:", error.message);
      return null;
    }

    return (data as SlaEventView | null) ?? null;
  } catch (error) {
    console.warn("[sla] getSlaEventByIncidentId failed:", error);
    return null;
  }
}

/** V2 SLA event + timers for an incident detail view. */
export async function getSLAForIncident(
  session: SessionContext,
  incident: {
    id: string;
    client_id: string;
    severity: IncidentSeverity;
  },
): Promise<IncidentSlaView> {
  try {
    const event = await getSlaEventByIncidentId(session.organization.id, incident.id);
    if (!event) {
      const contextMap = await getClientSlaContextMap(session.organization.id, [incident.client_id]);
      const context = contextMap.get(incident.client_id);
      return {
        event: null,
        timers: [],
        policyName: context?.policy?.name ?? null,
      };
    }

    let policyName: string | null = null;
    if (event.policy_id) {
      const policy = await getSlaPolicyById(session, event.policy_id);
      policyName = policy?.name ?? null;
    }

    return {
      event,
      timers: buildSlaTimers(event),
      policyName,
    };
  } catch (error) {
    console.warn("[sla] getSLAForIncident failed:", error);
    return { event: null, timers: [], policyName: null };
  }
}
