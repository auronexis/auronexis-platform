import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { CLICKUP_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type ClickupResource = {
  id: string;
  name: string;
  type: string;
};

export const CLICKUP_CONFIG = CLICKUP_CONNECTOR_CONFIG;
export type ClickupConnectorConfig = typeof CLICKUP_CONFIG;
