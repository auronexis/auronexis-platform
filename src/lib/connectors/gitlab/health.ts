import "server-only";
import { GITLAB_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";
import { evaluateConnectorHealth } from "@/lib/connectors/shared/health-factory";
import type { ConnectorHealthResult } from "@/lib/connectors/types";

export async function checkGitlabHealth(
  organizationId: string,
  connectionId: string | null,
): Promise<ConnectorHealthResult> {
  return evaluateConnectorHealth(organizationId, connectionId, GITLAB_CONNECTOR_CONFIG);
}
