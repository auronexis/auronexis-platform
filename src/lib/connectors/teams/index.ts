export type { TeamsResource, TeamsConnectorConfig } from "@/lib/connectors/teams/types";
export { TEAMS_CONFIG } from "@/lib/connectors/teams/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/teams/auth";
export { createTeamsClient } from "@/lib/connectors/teams/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/teams/mapper";
export { checkTeamsHealth } from "@/lib/connectors/teams/health";
export { syncTeams } from "@/lib/connectors/teams/sync";
export {
  parseTeamsWebhook,
  validateTeamsWebhookSignature,
  WEBHOOK_CONFIG,
  type TeamsWebhookEvent,
} from "@/lib/connectors/teams/webhook";
