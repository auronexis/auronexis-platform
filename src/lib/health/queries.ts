import { calculateHealth } from "@/lib/health/engine";
import type {
  ClientHealthSummary,
  HealthDashboardMetrics,
  HealthMetricsInput,
  HealthSnapshot,
  HealthStatus,
} from "@/lib/health/types";
import { parseHealthBreakdown } from "@/lib/health/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientView } from "@/lib/clients/types";

const HEALTH_SNAPSHOT_SELECT =
  "id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at";

const RECENT_ACTIVITY_DAYS = 14;
const REPORT_WINDOW_DAYS = 45;
const INACTIVE_DAYS = 30;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function mapSnapshotRow(row: Record<string, unknown>): HealthSnapshot {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    client_id: String(row.client_id),
    score: Number(row.score),
    status: row.status as HealthStatus,
    delta: Number(row.delta ?? 0),
    reason: (row.reason as string | null) ?? null,
    breakdown: parseHealthBreakdown(row.breakdown as never),
    calculated_at: String(row.calculated_at),
  };
}

function latestSnapshotByClient(rows: HealthSnapshot[]): Map<string, HealthSnapshot> {
  const map = new Map<string, HealthSnapshot>();

  for (const row of rows) {
    if (!map.has(row.client_id)) {
      map.set(row.client_id, row);
    }
  }

  return map;
}

/** Gather operational signals used by the health engine. */
export async function gatherClientHealthMetrics(
  session: SessionContext,
  clientId: string,
  clientStatus: string,
): Promise<HealthMetricsInput> {
  const supabase = await createClient();
  const organizationId = session.organization.id;
  const activitySince = daysAgo(RECENT_ACTIVITY_DAYS);
  const reportSince = daysAgo(REPORT_WINDOW_DAYS);
  const inactiveSince = daysAgo(INACTIVE_DAYS);

  const [incidentsResult, risksResult, reportsResult, portalResult, activityResult, clientActivityResult] =
    await Promise.all([
      supabase
        .from("incidents")
        .select("id, status, created_at")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .neq("status", "archived"),
      supabase
        .from("risks")
        .select("id, status, created_at")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .neq("status", "archived"),
      supabase
        .from("reports")
        .select("id, status, updated_at")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .in("status", ["ready", "published", "sent"])
        .gte("updated_at", reportSince)
        .limit(1),
      supabase
        .from("client_portal_users")
        .select("id, is_disabled, last_login_at")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId),
      supabase
        .from("activity_events")
        .select("id")
        .eq("organization_id", organizationId)
        .gte("created_at", activitySince)
        .or(`and(entity_type.eq.client,entity_id.eq.${clientId})`)
        .limit(1),
      supabase
        .from("activity_events")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .gte("created_at", inactiveSince)
        .limit(1),
    ]);

  const openIncidents = (incidentsResult.data ?? []) as Array<{ status: string; created_at: string }>;
  const openRisks = (risksResult.data ?? []) as Array<{ status: string; created_at: string }>;

  const slaViolations =
    openIncidents.filter((item) => {
      const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
      return item.status !== "resolved" && ageHours > 48;
    }).length +
    openRisks.filter((item) => {
      const ageHours = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
      return item.status !== "resolved" && ageHours > 72;
    }).length;

  const portalUsers = (portalResult.data ?? []) as Array<{
    is_disabled: boolean;
    last_login_at: string | null;
  }>;
  const activePortalUsers = portalUsers.filter((user) => !user.is_disabled);
  const portalEnabled = activePortalUsers.length > 0;
  const portalDisabled = portalUsers.length > 0 && activePortalUsers.length === 0;

  const recentEngagement = activePortalUsers.some((user) => {
    if (!user.last_login_at) {
      return false;
    }

    return new Date(user.last_login_at).getTime() >= new Date(activitySince).getTime();
  });

  const hasRecentReport = (reportsResult.data ?? []).length > 0;
  const hasRecentActivity = (activityResult.data ?? []).length > 0;
  const hasClientActivity = (clientActivityResult.data ?? []).length > 0;

  return {
    slaViolations,
    isInactiveClient: clientStatus === "archived" || !hasClientActivity,
    missingReports: !hasRecentReport,
    portalDisabled,
    noRecentActivity: !hasRecentActivity,
    healthySla: slaViolations === 0,
    portalEnabled,
    recentEngagement: recentEngagement || hasRecentActivity,
  };
}

export async function getLatestHealthSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<HealthSnapshot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_snapshots")
    .select(HEALTH_SNAPSHOT_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[health] failed to load latest snapshot:", error.message);
    return null;
  }

  return data ? mapSnapshotRow(data as Record<string, unknown>) : null;
}

export async function listHealthSnapshots(
  session: SessionContext,
  clientId: string,
  limit = 10,
): Promise<HealthSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_snapshots")
    .select(HEALTH_SNAPSHOT_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("calculated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[health] failed to list snapshots:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>));
}

export async function getClientHealthSummaries(
  session: SessionContext,
  clientIds: string[],
): Promise<Map<string, ClientHealthSummary>> {
  const summaries = new Map<string, ClientHealthSummary>();

  if (clientIds.length === 0) {
    return summaries;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_snapshots")
    .select(HEALTH_SNAPSHOT_SELECT)
    .eq("organization_id", session.organization.id)
    .in("client_id", clientIds)
    .order("calculated_at", { ascending: false });

  if (error) {
    console.warn("[health] failed to load client summaries:", error.message);
    return summaries;
  }

  const latest = latestSnapshotByClient((data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>)));

  for (const [clientId, snapshot] of latest.entries()) {
    summaries.set(clientId, {
      clientId,
      score: snapshot.score,
      status: snapshot.status,
      delta: snapshot.delta,
      reason: snapshot.reason,
      calculatedAt: snapshot.calculated_at,
    });
  }

  return summaries;
}

/** Resolve list health badges from snapshots, with live previews for untracked clients. */
export async function enrichClientHealthSummaries(
  session: SessionContext,
  clients: Pick<ClientView, "id" | "name" | "status" | "updated_at">[],
): Promise<Map<string, ClientHealthSummary>> {
  const summaries = await getClientHealthSummaries(
    session,
    clients.map((client) => client.id),
  );

  await Promise.all(
    clients
      .filter((client) => !summaries.has(client.id))
      .map(async (client) => {
        const result = await calculateClientHealthPreview(session, client);
        summaries.set(client.id, {
          clientId: client.id,
          score: result.score,
          status: result.status,
          delta: result.delta,
          reason: result.reason,
          calculatedAt: new Date().toISOString(),
        });
      }),
  );

  return summaries;
}

export async function getHealthDashboardMetrics(session: SessionContext): Promise<HealthDashboardMetrics> {
  const empty: HealthDashboardMetrics = {
    averageScore: null,
    excellentClients: 0,
    healthyClients: 0,
    watchClients: 0,
    criticalClients: 0,
    trackedClients: 0,
    trendDelta: null,
    trendLabel: "No trend data yet",
    hasSnapshots: false,
  };

  const supabase = await createClient();
  const organizationId = session.organization.id;
  const since = daysAgo(30);

  const { data, error } = await supabase
    .from("health_snapshots")
    .select(HEALTH_SNAPSHOT_SELECT)
    .eq("organization_id", organizationId)
    .order("calculated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[health] failed to load dashboard metrics:", error.message);
    return empty;
  }

  const rows = (data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>));
  if (rows.length === 0) {
    return empty;
  }

  const latestByClient = latestSnapshotByClient(rows);
  const latestSnapshots = [...latestByClient.values()];
  const averageScore = Math.round(
    latestSnapshots.reduce((sum, snapshot) => sum + snapshot.score, 0) / latestSnapshots.length,
  );

  const counts = {
    excellentClients: latestSnapshots.filter((snapshot) => snapshot.status === "excellent").length,
    healthyClients: latestSnapshots.filter((snapshot) => snapshot.status === "healthy").length,
    watchClients: latestSnapshots.filter((snapshot) => snapshot.status === "watch").length,
    criticalClients: latestSnapshots.filter((snapshot) => snapshot.status === "critical").length,
  };

  const recentRows = rows.filter((row) => row.calculated_at >= since);
  const olderRows = rows.filter((row) => row.calculated_at < since);
  const recentLatest = [...latestSnapshotByClient(recentRows).values()];
  const olderLatest = [...latestSnapshotByClient(olderRows).values()];

  let trendDelta: number | null = null;
  let trendLabel = "Stable over the last 30 days";

  if (recentLatest.length > 0 && olderLatest.length > 0) {
    const recentAvg =
      recentLatest.reduce((sum, snapshot) => sum + snapshot.score, 0) / recentLatest.length;
    const olderAvg =
      olderLatest.reduce((sum, snapshot) => sum + snapshot.score, 0) / olderLatest.length;
    trendDelta = Math.round(recentAvg - olderAvg);
    trendLabel =
      trendDelta > 0
        ? `Improving by ${trendDelta} pts`
        : trendDelta < 0
          ? `Declining by ${Math.abs(trendDelta)} pts`
          : "Stable over the last 30 days";
  }

  return {
    averageScore,
    ...counts,
    trackedClients: latestSnapshots.length,
    trendDelta,
    trendLabel,
    hasSnapshots: true,
  };
}

export async function calculateClientHealthPreview(
  session: SessionContext,
  client: Pick<ClientView, "id" | "name" | "status" | "updated_at">,
): Promise<ReturnType<typeof calculateHealth>> {
  const previous = await getLatestHealthSnapshot(session, client.id);
  const metrics = await gatherClientHealthMetrics(session, client.id, client.status);

  return calculateHealth({
    client: {
      id: client.id,
      name: client.name,
      status: client.status,
      updated_at: client.updated_at,
    },
    metrics,
    previousScore: previous?.score ?? null,
  });
}
