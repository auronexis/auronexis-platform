export type { HubspotResource, HubspotConnectorConfig } from "@/lib/connectors/hubspot/types";
export { HUBSPOT_CONFIG } from "@/lib/connectors/hubspot/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/hubspot/auth";
export { createHubspotClient } from "@/lib/connectors/hubspot/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/hubspot/mapper";
export { checkHubspotHealth } from "@/lib/connectors/hubspot/health";
export { syncHubspot } from "@/lib/connectors/hubspot/sync";
export {
  parseHubspotWebhook,
  validateHubspotWebhookSignature,
  WEBHOOK_CONFIG,
  type HubspotWebhookEvent,
} from "@/lib/connectors/hubspot/webhook";
