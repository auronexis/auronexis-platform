import "server-only";
import { GOOGLE_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function createGoogleClient(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, GOOGLE_CONNECTOR_CONFIG);
}
