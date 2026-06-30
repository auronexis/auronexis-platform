import { createClient } from "@/lib/supabase/server";
import type { HealthSnapshot } from "@/lib/health/types";
import { parseHealthBreakdown } from "@/lib/health/types";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import type {
  PortalContactsData,
  PortalDashboardData,
  PortalIncidentView,
  PortalOverviewData,
  PortalReportListItem,
  PortalReportView,
  PortalRiskView,
  PortalTimelineEvent,
} from "@/lib/client-portal/types";
import {
  HEALTH_SNAPSHOT_PORTAL_SELECT,
  PORTAL_INCIDENT_SELECT,
  PORTAL_REPORT_LIST_SELECT,
  PORTAL_REPORT_SELECT,
  PORTAL_RISK_SELECT,
  PORTAL_TIMELINE_EVENT_TYPES,
  PORTAL_USER_SELECT,
} from "@/lib/client-portal/types";
import type { ClientSlaAssignment } from "@/lib/sla/types";
import {
  PORTAL_VISIBLE_REPORT_STATUSES,
  type ClientReportMetrics,
  type RelatedOpenIncident,
  type RelatedOpenRisk,
} from "@/lib/reports/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientPortalUser, SlaPolicy } from "@/types/database";

const SLA_POLICY_PORTAL_SELECT =
  "id, organization_id, name, incident_hours, risk_hours, is_default, created_at, updated_at";

/** Portal users linked to a client — agency Owner/Admin only (RLS). */
export async function listPortalUsersForClient(
  session: SessionContext,
  clientId: string,
): Promise<ClientPortalUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_portal_users")
    .select(PORTAL_USER_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientPortalUser[];
}

/** Dashboard summary for the signed-in portal user. */
export async function getPortalDashboardData(
  session: ClientPortalSessionContext,
): Promise<PortalDashboardData> {
  const supabase = await createClient();
  const clientId = session.client.id;

  const [risksResult, incidentsResult, latestReportResult] = await Promise.all([
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"]),
    supabase
      .from("reports")
      .select(PORTAL_REPORT_LIST_SELECT)
      .eq("client_id", clientId)
      .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (risksResult.error || incidentsResult.error || latestReportResult.error) {
    throw new Error("Unable to load portal dashboard.");
  }

  return {
    clientName: session.client.name,
    clientStatus: session.client.status,
    openRisksCount: risksResult.count ?? 0,
    openIncidentsCount: incidentsResult.count ?? 0,
    latestReport: (latestReportResult.data as PortalReportListItem | null) ?? null,
  };
}

/** Published and sent reports visible to the portal user. */
export async function listPortalReports(
  session: ClientPortalSessionContext,
): Promise<PortalReportListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(PORTAL_REPORT_LIST_SELECT)
    .eq("client_id", session.client.id)
    .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalReportListItem[];
}

/** Single published or sent report for portal viewing. */
export async function getPortalReportById(
  session: ClientPortalSessionContext,
  reportId: string,
): Promise<PortalReportView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(PORTAL_REPORT_SELECT)
    .eq("id", reportId)
    .eq("client_id", session.client.id)
    .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PortalReportView | null) ?? null;
}

/** Open risks for the portal user's client. */
export async function listPortalRisks(
  session: ClientPortalSessionContext,
): Promise<PortalRiskView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select(PORTAL_RISK_SELECT)
    .eq("client_id", session.client.id)
    .in("status", ["open", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalRiskView[];
}

/** Open incidents for the portal user's client. */
export async function listPortalIncidents(
  session: ClientPortalSessionContext,
): Promise<PortalIncidentView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(PORTAL_INCIDENT_SELECT)
    .eq("client_id", session.client.id)
    .in("status", ["open", "investigating"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalIncidentView[];
}

/** Metrics for portal PDF export. */
export async function getPortalReportMetrics(
  session: ClientPortalSessionContext,
): Promise<ClientReportMetrics> {
  const supabase = await createClient();
  const clientId = session.client.id;

  const [openRisks, criticalRisks, openIncidents, criticalIncidents] = await Promise.all([
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", ["open", "in_progress"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", ["open", "investigating"]),
  ]);

  if (openRisks.error || criticalRisks.error || openIncidents.error || criticalIncidents.error) {
    throw new Error("Unable to load report metrics.");
  }

  return {
    openRisksCount: openRisks.count ?? 0,
    criticalRisksCount: criticalRisks.count ?? 0,
    openIncidentsCount: openIncidents.count ?? 0,
    criticalIncidentsCount: criticalIncidents.count ?? 0,
  };
}

/** Related open risks for portal PDF export. */
export async function getPortalRelatedOpenRisks(
  session: ClientPortalSessionContext,
): Promise<RelatedOpenRisk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select("id, title, severity, status, due_date")
    .eq("client_id", session.client.id)
    .in("status", ["open", "in_progress"])
    .order("severity", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenRisk[];
}

/** Related open incidents for portal PDF export. */
export async function getPortalRelatedOpenIncidents(
  session: ClientPortalSessionContext,
): Promise<RelatedOpenIncident[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("id, title, severity, status, due_at")
    .eq("client_id", session.client.id)
    .in("status", ["open", "investigating"])
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenIncident[];
}

/** Portal customer onboarding status for the signed-in client. */
export async function getPortalCustomerOnboarding(session: ClientPortalSessionContext) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portal_customer_onboarding")
      .select("*")
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function mapHealthSnapshotRow(row: Record<string, unknown>): HealthSnapshot {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    client_id: String(row.client_id),
    score: Number(row.score),
    status: row.status as HealthSnapshot["status"],
    delta: Number(row.delta ?? 0),
    reason: (row.reason as string | null) ?? null,
    breakdown: parseHealthBreakdown(row.breakdown as never),
    calculated_at: String(row.calculated_at),
  };
}

/** Latest health snapshot for the portal user's client — read-only. */
export async function getPortalLatestHealthSnapshot(
  session: ClientPortalSessionContext,
): Promise<HealthSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("health_snapshots")
      .select(HEALTH_SNAPSHOT_PORTAL_SELECT)
      .eq("client_id", session.client.id)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapHealthSnapshotRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Health snapshot history for the portal user's client — read-only. */
export async function listPortalHealthSnapshots(
  session: ClientPortalSessionContext,
  limit = 10,
): Promise<HealthSnapshot[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("health_snapshots")
      .select(HEALTH_SNAPSHOT_PORTAL_SELECT)
      .eq("client_id", session.client.id)
      .order("calculated_at", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((row) => mapHealthSnapshotRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

async function getPortalDefaultSlaPolicy(
  organizationId: string,
): Promise<SlaPolicy | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sla_policies")
    .select(SLA_POLICY_PORTAL_SELECT)
    .eq("organization_id", organizationId)
    .eq("is_default", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SlaPolicy;
}

/** SLA assignment visible to the portal user for their client. */
export async function getPortalSlaAssignment(
  session: ClientPortalSessionContext,
): Promise<ClientSlaAssignment> {
  const defaultPolicy = await getPortalDefaultSlaPolicy(session.organization.id);
  const assignedPolicyId = session.client.sla_policy_id;

  if (assignedPolicyId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sla_policies")
      .select(SLA_POLICY_PORTAL_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("id", assignedPolicyId)
      .maybeSingle();

    if (error) {
      return {
        assignedPolicyId,
        effectivePolicy: defaultPolicy,
        source: defaultPolicy ? "inherited" : "none",
      };
    }

    const policy = (data as SlaPolicy | null) ?? null;

    return {
      assignedPolicyId,
      effectivePolicy: policy ?? defaultPolicy,
      source: policy ? "assigned" : defaultPolicy ? "inherited" : "none",
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

/** Client-facing activity timeline for the portal user. */
export async function listPortalTimelineEvents(
  session: ClientPortalSessionContext,
  limit = 20,
): Promise<PortalTimelineEvent[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("activity_events")
      .select("id, event_type, title, description, created_at")
      .eq("organization_id", session.organization.id)
      .in("event_type", [...PORTAL_TIMELINE_EVENT_TYPES])
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    if (error || !data) {
      return [];
    }

    return (data as PortalTimelineEvent[]).slice(0, limit);
  } catch {
    return [];
  }
}

/** Contacts and support details for the portal user. */
export async function getPortalContacts(
  session: ClientPortalSessionContext,
  supportEmail: string | null,
): Promise<PortalContactsData> {
  let accountOwnerName: string | null = null;

  if (session.client.owner_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", session.client.owner_id)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    accountOwnerName = (data as { full_name: string } | null)?.full_name ?? null;
  }

  return {
    contactName: session.client.contact_name,
    contactEmail: session.client.contact_email,
    accountOwnerName,
    supportEmail,
  };
}

/** Overview workspace data for the portal home page. */
export async function getPortalOverviewData(
  session: ClientPortalSessionContext,
  supportEmail: string | null,
): Promise<PortalOverviewData> {
  const [healthSnapshot, latestReportResult, slaAssignment, recentEvents, contacts] =
    await Promise.all([
      getPortalLatestHealthSnapshot(session),
      (async () => {
        const supabase = await createClient();
        return supabase
          .from("reports")
          .select(PORTAL_REPORT_LIST_SELECT)
          .eq("client_id", session.client.id)
          .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();
      })(),
      getPortalSlaAssignment(session),
      listPortalTimelineEvents(session, 5),
      getPortalContacts(session, supportEmail),
    ]);

  const latestReport =
    latestReportResult.error || !latestReportResult.data
      ? null
      : (latestReportResult.data as PortalReportListItem);

  return {
    clientName: session.client.name,
    health: healthSnapshot
      ? {
          score: healthSnapshot.score,
          status: healthSnapshot.status,
          delta: healthSnapshot.delta,
          reason: healthSnapshot.reason,
          calculated_at: healthSnapshot.calculated_at,
        }
      : null,
    latestReport,
    slaAssignment,
    recentEvents,
    contacts,
  };
}
