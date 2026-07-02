import "server-only";

import type { HealthSnapshot } from "@/lib/health/types";
import { parseHealthBreakdown } from "@/lib/health/types";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import { HEALTH_SNAPSHOT_PORTAL_SELECT } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";

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

function sanitizeBreakdown(snapshot: HealthSnapshot): HealthSnapshot {
  const breakdown = snapshot.breakdown;
  return {
    ...snapshot,
    breakdown: {
      baseScore: breakdown.baseScore,
      penalties: breakdown.penalties,
      bonuses: breakdown.bonuses,
    },
  };
}

/** Portal health snapshot — client scoped, never throws. */
export async function getPortalHealth(
  session: ClientPortalSessionContext,
): Promise<{ latest: HealthSnapshot | null; history: HealthSnapshot[] }> {
  try {
    const supabase = await createClient();
    const [latestResult, historyResult] = await Promise.all([
      supabase
        .from("health_snapshots")
        .select(HEALTH_SNAPSHOT_PORTAL_SELECT)
        .eq("organization_id", session.organization.id)
        .eq("client_id", session.client.id)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("health_snapshots")
        .select(HEALTH_SNAPSHOT_PORTAL_SELECT)
        .eq("organization_id", session.organization.id)
        .eq("client_id", session.client.id)
        .order("calculated_at", { ascending: false })
        .limit(12),
    ]);

    const latest =
      latestResult.data != null
        ? sanitizeBreakdown(mapHealthSnapshotRow(latestResult.data as Record<string, unknown>))
        : null;
    const history = (historyResult.data ?? []).map((row) =>
      sanitizeBreakdown(mapHealthSnapshotRow(row as Record<string, unknown>)),
    );

    return { latest, history };
  } catch {
    return { latest: null, history: [] };
  }
}
