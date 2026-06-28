import "server-only";
import { HUBSPOT_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function createHubspotClient(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, HUBSPOT_CONNECTOR_CONFIG);
}
