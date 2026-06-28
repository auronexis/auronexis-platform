import "server-only";
import { NOTION_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function createNotionClient(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, NOTION_CONNECTOR_CONFIG);
}
