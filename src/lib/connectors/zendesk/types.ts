import { ZENDESK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type ZendeskResource = {
  id: string;
  name: string;
  type: string;
};

export const ZENDESK_CONFIG = ZENDESK_CONNECTOR_CONFIG;
export type ZendeskConnectorConfig = typeof ZENDESK_CONFIG;
