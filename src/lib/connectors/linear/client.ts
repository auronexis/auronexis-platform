import "server-only";
import { LINEAR_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function createLinearClient(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, LINEAR_CONNECTOR_CONFIG);
}
