import "server-only";
import { TEAMS_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";
import type { ConnectorHealthResult } from "@/lib/connectors/types";

export async function checkTeamsHealth(
  organizationId: string,
  connectionId: string | null,
): Promise<ConnectorHealthResult> {
  return evaluateConnectorHealth(organizationId, connectionId, TEAMS_CONNECTOR_CONFIG);
}
