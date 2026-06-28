import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { MICROSOFT_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type MicrosoftResource = {
  id: string;
  name: string;
  type: string;
};

export const MICROSOFT_CONFIG = MICROSOFT_CONNECTOR_CONFIG;
export type MicrosoftConnectorConfig = typeof MICROSOFT_CONFIG;
