import "server-only";

import type { HealthSnapshot } from "@/lib/health/types";
import { HEALTH_SNAPSHOT_SELECT, mapHealthSnapshotRow } from "@/lib/health/types";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import { createClient } from "@/lib/supabase/server";

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
        .select(HEALTH_SNAPSHOT_SELECT)
        .eq("organization_id", session.organization.id)
        .eq("client_id", session.client.id)
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("health_snapshots")
        .select(HEALTH_SNAPSHOT_SELECT)
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
