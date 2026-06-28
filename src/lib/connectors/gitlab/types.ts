import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { GITLAB_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type GitlabResource = {
  id: string;
  name: string;
  type: string;
};

export const GITLAB_CONFIG = GITLAB_CONNECTOR_CONFIG;
export type GitlabConnectorConfig = typeof GITLAB_CONFIG;
