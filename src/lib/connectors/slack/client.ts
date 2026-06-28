import "server-only";
import { SLACK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { createConnectorClient, type ConnectorClient } from "@/lib/connectors/shared/client-factory";

export async function createSlackClient(
  organizationId: string,
  connectionId: string,
): Promise<ConnectorClient> {
  return createConnectorClient(organizationId, connectionId, SLACK_CONNECTOR_CONFIG);
}
