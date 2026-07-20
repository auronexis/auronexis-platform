import { HUBSPOT_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type HubspotResource = {
  id: string;
  name: string;
  type: string;
};

export const HUBSPOT_CONFIG = HUBSPOT_CONNECTOR_CONFIG;
export type HubspotConnectorConfig = typeof HUBSPOT_CONFIG;
