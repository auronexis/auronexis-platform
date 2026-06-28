import type { ConnectorModuleConfig } from "@/lib/connectors/shared/module-config";
import { SALESFORCE_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type SalesforceResource = {
  id: string;
  name: string;
  type: string;
};

export const SALESFORCE_CONFIG = SALESFORCE_CONNECTOR_CONFIG;
export type SalesforceConnectorConfig = typeof SALESFORCE_CONFIG;
