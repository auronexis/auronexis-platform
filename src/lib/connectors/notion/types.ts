import { NOTION_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type NotionResource = {
  id: string;
  name: string;
  type: string;
};

export const NOTION_CONFIG = NOTION_CONNECTOR_CONFIG;
export type NotionConnectorConfig = typeof NOTION_CONFIG;
