import { GOOGLE_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type GoogleResource = {
  id: string;
  name: string;
  type: string;
};

export const GOOGLE_CONFIG = GOOGLE_CONNECTOR_CONFIG;
export type GoogleConnectorConfig = typeof GOOGLE_CONFIG;
