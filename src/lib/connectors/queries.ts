import "server-only";

import { bootstrapConnectors } from "@/lib/connectors/bootstrap";
import { ALL_CONNECTOR_CONFIGS } from "@/lib/connectors/definitions";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";
import { listConnectorDefinitions } from "@/lib/connectors/registry";
import type {
  ConnectorConnectionView,
  ConnectorsDashboardSnapshot,
  ConnectorId,
} from "@/lib/connectors/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { IntegrationConnection } from "@/types/database";

function rowToConnectionView(row: IntegrationConnection): ConnectorConnectionView {
  return {
    id: row.id,
    connectorId: row.connector_id as ConnectorId,
    connectorVersion: row.connector_version,
    displayName: row.display_name,
    status: row.status,
    scopes: row.scopes ?? [],
    tokenExpiresAt: row.token_expires_at,
    lastSyncAt: row.last_sync_at,
    lastSyncStatus: row.last_sync_status,
    healthStatus: row.health_status as ConnectorConnectionView["healthStatus"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listConnectorConnections(
  session: SessionContext,
): Promise<ConnectorConnectionView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as IntegrationConnection[]).map(rowToConnectionView);
}

export async function getConnectorConnectionByConnectorId(
  session: SessionContext,
  connectorId: ConnectorId,
): Promise<ConnectorConnectionView | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("integration_connections")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("connector_id", connectorId)
    .eq("status", "connected")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? rowToConnectionView(data as IntegrationConnection) : null;
}

export async function getConnectorsDashboardSnapshot(
  session: SessionContext,
): Promise<ConnectorsDashboardSnapshot> {
  bootstrapConnectors();
  const definitions = listConnectorDefinitions();
  const connections = await listConnectorConnections(session);
  const connectionByConnector = new Map(connections.map((item) => [item.connectorId, item]));

  const now = Date.now();
  const expiringSoonMs = 7 * 24 * 60 * 60 * 1000;

  const connectors = await Promise.all(
    definitions.map(async (definition) => {
      const config = ALL_CONNECTOR_CONFIGS.find((item) => item.id === definition.id)!;
      const connection = connectionByConnector.get(definition.id) ?? null;
      const health = await evaluateConnectorHealth(
        session.organization.id,
        connection?.id ?? null,
        config,
      );
      return { definition, connection, health };
    }),
  );

  const connectedCount = connectors.filter((item) => item.connection?.status === "connected").length;
  const healthyCount = connectors.filter((item) => item.health.status === "healthy").length;
  const expiringSoonCount = connectors.filter((item) => {
    if (!item.connection?.tokenExpiresAt) return false;
    const expires = new Date(item.connection.tokenExpiresAt).getTime();
    return expires > now && expires - now <= expiringSoonMs;
  }).length;
  const lastSyncFailures = connectors.filter((item) => item.connection?.lastSyncStatus === "failed")
    .length;

  return {
    registeredCount: definitions.length,
    connectedCount,
    healthyCount,
    expiringSoonCount,
    lastSyncFailures,
    connectors,
  };
}

export function getConnectorConfig(connectorId: ConnectorId) {
  return ALL_CONNECTOR_CONFIGS.find((item) => item.id === connectorId);
}
