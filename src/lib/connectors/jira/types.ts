import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { JIRA_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type JiraResource = {
  id: string;
  name: string;
  type: string;
};

export const JIRA_CONFIG = JIRA_CONNECTOR_CONFIG;
export type JiraConnectorConfig = typeof JIRA_CONFIG;
