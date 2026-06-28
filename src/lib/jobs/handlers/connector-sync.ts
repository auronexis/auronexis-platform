import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Enqueue connector sync jobs for active connections (deduplicated via queue). */
export async function processConnectorSyncJob(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const { data: connections, error } = await admin
    .from("integration_connections")
    .select("id, organization_id, connector_id, status")
    .eq("status", "connected");

  if (error) {
    throw new Error(error.message);
  }

  let enqueued = 0;

  for (const connection of (connections ?? []) as Array<Record<string, unknown>>) {
    const organizationId = connection.organization_id as string;
    const connectionId = connection.id as string;
    const connectorId = connection.connector_id as string;

    const { error: queueError } = await admin.from("queue_jobs").insert({
      queue_name: "connector_sync",
      organization_id: organizationId,
      job_type: "connector.sync",
      payload: { connectionId, connectorId },
      idempotency_key: `connector_sync:${connectionId}:${new Date().toISOString().slice(0, 10)}`,
      status: "pending",
    } as never);

    if (!queueError) {
      enqueued += 1;
    }
  }

  return { enqueued, connectionCount: connections?.length ?? 0 };
}
