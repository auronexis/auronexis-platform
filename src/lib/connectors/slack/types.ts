import { SLACK_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type SlackResource = {
  id: string;
  name: string;
  type: string;
};

export const SLACK_CONFIG = SLACK_CONNECTOR_CONFIG;
export type SlackConnectorConfig = typeof SLACK_CONFIG;
