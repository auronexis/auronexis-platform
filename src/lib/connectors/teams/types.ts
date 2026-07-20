import { TEAMS_CONNECTOR_CONFIG } from "@/lib/connectors/definitions";

export type TeamsResource = {
  id: string;
  name: string;
  type: string;
};

export const TEAMS_CONFIG = TEAMS_CONNECTOR_CONFIG;
export type TeamsConnectorConfig = typeof TEAMS_CONFIG;
