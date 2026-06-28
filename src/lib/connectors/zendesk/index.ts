export type { ZendeskResource, ZendeskConnectorConfig } from "@/lib/connectors/zendesk/types";
export { ZENDESK_CONFIG } from "@/lib/connectors/zendesk/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/zendesk/auth";
export { createZendeskClient } from "@/lib/connectors/zendesk/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/zendesk/mapper";
export { checkZendeskHealth } from "@/lib/connectors/zendesk/health";
export { syncZendesk } from "@/lib/connectors/zendesk/sync";
export {
  parseZendeskWebhook,
  validateZendeskWebhookSignature,
  WEBHOOK_CONFIG,
  type ZendeskWebhookEvent,
} from "@/lib/connectors/zendesk/webhook";
