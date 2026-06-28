import "server-only";

import { bootstrapConnectors } from "@/lib/connectors/bootstrap";
import { ALL_CONNECTOR_CONFIGS } from "@/lib/connectors/definitions";
import { listConnectorConnections } from "@/lib/connectors/queries";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";
import { isConnectorOAuthConfigured } from "@/lib/connectors/oauth/platform";
import type {
  ConnectorDiagnosticsRow,
  ConnectorsDiagnosticsSnapshot,
} from "@/lib/connectors/types";
import type { SessionContext } from "@/lib/tenancy/context";

export async function getConnectorsDiagnosticsSnapshot(
  session: SessionContext,
): Promise<ConnectorsDiagnosticsSnapshot> {
  bootstrapConnectors();

  const connections = await listConnectorConnections(session);
  const connectionByConnector = new Map(connections.map((item) => [item.connectorId, item]));

  const providers: ConnectorDiagnosticsRow[] = await Promise.all(
    ALL_CONNECTOR_CONFIGS.map(async (config) => {
      const connection = connectionByConnector.get(config.id) ?? null;
      const health = await evaluateConnectorHealth(
        session.organization.id,
        connection?.id ?? null,
        config,
      );

      return {
        connectorId: config.id,
        name: config.name,
        connected: connection?.status === "connected",
        oauthConfigured:
          config.oauth === "none" ? true : isConnectorOAuthConfigured(config),
        tokenValid: health.tokenValid,
        tokenExpiresAt: connection?.tokenExpiresAt ?? null,
        healthStatus: health.status,
        lastSyncAt: connection?.lastSyncAt ?? null,
        lastSyncStatus: connection?.lastSyncStatus ?? null,
      };
    }),
  );

  const now = Date.now();
  const connectedProviders = providers.filter((item) => item.connected).length;
  const validTokens = providers.filter((item) => item.connected && item.tokenValid).length;
  const expiredTokens = providers.filter((item) => {
    if (!item.tokenExpiresAt) return false;
    return new Date(item.tokenExpiresAt).getTime() <= now;
  }).length;
  const refreshFailures = connections.filter(
    (item) => item.status === "error" || item.status === "expired",
  ).length;
  const unhealthyConnections = providers.filter(
    (item) => item.connected && item.healthStatus !== "healthy",
  ).length;
  const oauthConfiguredConnectors = providers.filter((item) => item.oauthConfigured).length;

  const lastSyncAt = connections.reduce<string | null>((latest, connection) => {
    if (!connection.lastSyncAt) {
      return latest;
    }
    if (!latest || connection.lastSyncAt > latest) {
      return connection.lastSyncAt;
    }
    return latest;
  }, null);

  return {
    registeredConnectors: ALL_CONNECTOR_CONFIGS.length,
    connectedProviders,
    oauthConfiguredConnectors,
    validTokens,
    expiredTokens,
    refreshFailures,
    lastSyncAt,
    unhealthyConnections,
    apiQuotaAvailable: false,
    providers,
  };
}
