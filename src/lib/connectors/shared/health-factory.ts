import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isConnectorOAuthConfigured } from "@/lib/connectors/oauth/platform";
import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { createConnectorClient } from "@/lib/connectors/shared/client-factory";
import type { ConnectorHealthResult } from "@/lib/connectors/types";
import type { IntegrationConnection } from "@/types/database";

export async function evaluateConnectorHealth(
  organizationId: string,
  connectionId: string | null,
  config: ConnectorModuleConfig,
): Promise<ConnectorHealthResult> {
  if (!connectionId) {
    return {
      connectorId: config.id,
      status: "unknown",
      connected: false,
      tokenValid: false,
      tokenExpiresAt: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      messages: ["Not connected."],
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .maybeSingle();

  if (!data) {
    return {
      connectorId: config.id,
      status: "unhealthy",
      connected: false,
      tokenValid: false,
      tokenExpiresAt: null,
      lastSyncAt: null,
      lastSyncStatus: null,
      messages: ["Connection record missing."],
    };
  }

  const connection = data as IntegrationConnection;
  const tokenExpired =
    connection.token_expires_at != null &&
    new Date(connection.token_expires_at).getTime() <= Date.now();

  const oauthReady =
    config.oauth === "none" ? true : isConnectorOAuthConfigured(config);

  let apiMessage = oauthReady ? "OAuth credentials configured." : "OAuth app credentials missing.";
  if (connection.status === "connected") {
    try {
      const client = await createConnectorClient(organizationId, connectionId, config);
      const health = await client.healthCheck();
      apiMessage = health.message;
    } catch (error) {
      apiMessage = error instanceof Error ? error.message : "Health check failed.";
    }
  }

  const status =
    connection.status === "connected" && !tokenExpired
      ? connection.health_status === "healthy"
        ? "healthy"
        : "degraded"
      : "unhealthy";

  return {
    connectorId: config.id,
    status,
    connected: connection.status === "connected",
    tokenValid: connection.status === "connected" && !tokenExpired,
    tokenExpiresAt: connection.token_expires_at,
    lastSyncAt: connection.last_sync_at,
    lastSyncStatus: connection.last_sync_status,
    messages: [apiMessage],
    apiQuotaRemaining: null,
  };
}
