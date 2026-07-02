import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiContext } from "@/lib/api/auth/context";
import { getClientById } from "@/lib/clients/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { parseHealthBreakdown, type HealthSnapshot } from "@/lib/health/types";

function mapHealthRow(row: Record<string, unknown>): HealthSnapshot {
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

export async function apiGetClientHealth(ctx: ApiContext, clientId: string) {
  const session = apiContextToSession(ctx);
  const client = await getClientById(session, clientId);
  if (!client) {
    return null;
  }

  const admin = createAdminClient();
  const [latestResult, historyResult] = await Promise.all([
    admin
      .from("health_snapshots")
      .select("id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at")
      .eq("organization_id", ctx.organization.id)
      .eq("client_id", clientId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("health_snapshots")
      .select("id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at")
      .eq("organization_id", ctx.organization.id)
      .eq("client_id", clientId)
      .order("calculated_at", { ascending: false })
      .limit(12),
  ]);

  return {
    client: { id: client.id, name: client.name },
    latest: latestResult.data
      ? mapHealthRow(latestResult.data as Record<string, unknown>)
      : null,
    history: (historyResult.data ?? []).map((row) =>
      mapHealthRow(row as Record<string, unknown>),
    ),
  };
}

export async function apiListActivityEvents(ctx: ApiContext, limit = 20) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("activity_events")
    .select("id, event_type, title, description, entity_type, entity_id, metadata, created_at")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export function apiGetMe(ctx: ApiContext) {
  return {
    organization: {
      id: ctx.organization.id,
      name: ctx.organization.name,
    },
    scopes: ctx.scopes,
    keyType: ctx.keyType,
  };
}
