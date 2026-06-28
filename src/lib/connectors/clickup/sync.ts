import "server-only";
import { CLICKUP_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { runConnectorSync, type SyncEngineResult } from "@/lib/connectors/sync";
import type { ConnectorSyncType } from "@/lib/connectors/types";

export async function syncClickup(input: {
  organizationId: string;
  connectionId: string;
  syncType: ConnectorSyncType;
}): Promise<SyncEngineResult> {
  return runConnectorSync({
    organizationId: input.organizationId,
    connectionId: input.connectionId,
    connectorId: CLICKUP_CONNECTOR_CONFIG.id,
    config: CLICKUP_CONNECTOR_CONFIG,
    syncType: input.syncType,
  });
}
