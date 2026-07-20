import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiContext } from "@/lib/api/auth/context";
import { getClientById } from "@/lib/clients/queries";
import { apiContextToSession } from "@/lib/api/resources/session";
import { HEALTH_SNAPSHOT_SELECT, mapHealthSnapshotRow } from "@/lib/health/types";

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
      .select(HEALTH_SNAPSHOT_SELECT)
      .eq("organization_id", ctx.organization.id)
      .eq("client_id", clientId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("health_snapshots")
      .select(HEALTH_SNAPSHOT_SELECT)
      .eq("organization_id", ctx.organization.id)
      .eq("client_id", clientId)
      .order("calculated_at", { ascending: false })
      .limit(12),
  ]);

  return {
    client: { id: client.id, name: client.name },
    latest: latestResult.data
      ? mapHealthSnapshotRow(latestResult.data as Record<string, unknown>)
      : null,
    history: (historyResult.data ?? []).map((row) =>
      mapHealthSnapshotRow(row as Record<string, unknown>),
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
