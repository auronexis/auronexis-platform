import { LINEAR_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type LinearResource = {
  id: string;
  name: string;
  type: string;
};

export const LINEAR_CONFIG = LINEAR_CONNECTOR_CONFIG;
export type LinearConnectorConfig = typeof LINEAR_CONFIG;
