import "server-only";

import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import type { ConnectorId, ConnectorSyncType } from "@/lib/connectors/types";
import {
  completeSyncJob,
  createSyncJob,
  getLastSyncCursor,
  markSyncJobRunning,
} from "@/lib/connectors/sync/repository";
import { createConnectorClient } from "@/lib/connectors/shared/client-factory";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";

export type SyncEngineResult = {
  jobId: string;
  status: "completed" | "failed";
  recordsChanged: number;
  durationMs: number;
  errorMessage?: string;
};

export async function runConnectorSync(input: {
  organizationId: string;
  connectionId: string;
  connectorId: ConnectorId;
  config: ConnectorModuleConfig;
  syncType: ConnectorSyncType;
}): Promise<SyncEngineResult> {
  const health = await evaluateConnectorHealth(input.organizationId, input.connectionId, input.config);
  if (!health.connected || !health.tokenValid) {
    throw new Error("Connection is not ready for sync.");
  }

  const cursor =
    input.syncType === "incremental"
      ? await getLastSyncCursor(input.organizationId, input.connectionId)
      : null;

  const jobId = await createSyncJob({
    organizationId: input.organizationId,
    connectionId: input.connectionId,
    connectorId: input.connectorId,
    syncType: input.syncType,
    cursor,
  });

  const startedAt = new Date().toISOString();
  await markSyncJobRunning(jobId, input.organizationId);

  try {
    const client = await createConnectorClient(input.organizationId, input.connectionId, input.config);
    const syncResult = await client.sync({
      syncType: input.syncType,
      cursor,
    });

    await completeSyncJob({
      jobId,
      organizationId: input.organizationId,
      status: "completed",
      recordsChanged: syncResult.recordsChanged,
      cursor: syncResult.nextCursor ?? null,
      startedAt,
    });

    return {
      jobId,
      status: "completed",
      recordsChanged: syncResult.recordsChanged,
      durationMs: Date.now() - new Date(startedAt).getTime(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await completeSyncJob({
      jobId,
      organizationId: input.organizationId,
      status: "failed",
      recordsChanged: 0,
      errorMessage: message,
      startedAt,
    });

    return {
      jobId,
      status: "failed",
      recordsChanged: 0,
      durationMs: Date.now() - new Date(startedAt).getTime(),
      errorMessage: message,
    };
  }
}

export async function scheduleConnectorSync(input: {
  organizationId: string;
  connectionId: string;
  connectorId: ConnectorId;
  config: ConnectorModuleConfig;
}): Promise<SyncEngineResult> {
  return runConnectorSync({
    ...input,
    syncType: "scheduled",
  });
}
