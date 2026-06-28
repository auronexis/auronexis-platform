import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  ConnectorId,
  ConnectorSyncJobView,
  ConnectorSyncStatus,
  ConnectorSyncType,
} from "@/lib/connectors/types";
import type { IntegrationSyncJob } from "@/types/database";

function rowToView(row: IntegrationSyncJob): ConnectorSyncJobView {
  return {
    id: row.id,
    connectionId: row.connection_id,
    connectorId: row.connector_id as ConnectorId,
    syncType: row.sync_type as ConnectorSyncType,
    status: row.status as ConnectorSyncStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    durationMs: row.duration_ms,
    recordsChanged: row.records_changed,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function createSyncJob(input: {
  organizationId: string;
  connectionId: string;
  connectorId: ConnectorId;
  syncType: ConnectorSyncType;
  cursor?: string | null;
}): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .insert({
      organization_id: input.organizationId,
      connection_id: input.connectionId,
      connector_id: input.connectorId,
      sync_type: input.syncType,
      status: "queued",
      cursor: input.cursor ?? null,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create sync job: ${error?.message ?? "unknown"}`);
  }

  return (data as { id: string }).id;
}

export async function markSyncJobRunning(jobId: string, organizationId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("integration_sync_jobs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
    } as never)
    .eq("organization_id", organizationId)
    .eq("id", jobId);
}

export async function completeSyncJob(input: {
  jobId: string;
  organizationId: string;
  status: Extract<ConnectorSyncStatus, "completed" | "failed">;
  recordsChanged: number;
  cursor?: string | null;
  errorMessage?: string | null;
  startedAt: string;
}): Promise<void> {
  const supabase = await createClient();
  const completedAt = new Date();
  const durationMs = Math.max(0, completedAt.getTime() - new Date(input.startedAt).getTime());

  await supabase
    .from("integration_sync_jobs")
    .update({
      status: input.status,
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
      records_changed: input.recordsChanged,
      cursor: input.cursor ?? null,
      error_message: input.errorMessage ?? null,
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("id", input.jobId);

  const { data: job } = await supabase
    .from("integration_sync_jobs")
    .select("connection_id")
    .eq("id", input.jobId)
    .maybeSingle();

  if (job) {
    await supabase
      .from("integration_connections")
      .update({
        last_sync_at: completedAt.toISOString(),
        last_sync_status: input.status === "completed" ? "success" : "failed",
        health_status: input.status === "completed" ? "healthy" : "degraded",
      } as never)
      .eq("organization_id", input.organizationId)
      .eq("id", (job as { connection_id: string }).connection_id);
  }
}

export async function listRecentSyncJobs(
  organizationId: string,
  limit = 20,
): Promise<ConnectorSyncJobView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_sync_jobs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return ((data ?? []) as IntegrationSyncJob[]).map(rowToView);
}

export async function getLastSyncCursor(
  organizationId: string,
  connectionId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("integration_sync_jobs")
    .select("cursor")
    .eq("organization_id", organizationId)
    .eq("connection_id", connectionId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? ((data as { cursor: string | null }).cursor ?? null) : null;
}
