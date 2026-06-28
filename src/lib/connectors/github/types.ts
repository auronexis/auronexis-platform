import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { GITHUB_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type GithubResource = {
  id: string;
  name: string;
  type: string;
};

export const GITHUB_CONFIG = GITHUB_CONNECTOR_CONFIG;
export type GithubConnectorConfig = typeof GITHUB_CONFIG;
