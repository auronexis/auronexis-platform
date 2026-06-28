export type { SalesforceResource, SalesforceConnectorConfig } from "@/lib/connectors/salesforce/types";
export { SALESFORCE_CONFIG } from "@/lib/connectors/salesforce/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/salesforce/auth";
export { createSalesforceClient } from "@/lib/connectors/salesforce/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/salesforce/mapper";
export { checkSalesforceHealth } from "@/lib/connectors/salesforce/health";
export { syncSalesforce } from "@/lib/connectors/salesforce/sync";
export {
  parseSalesforceWebhook,
  validateSalesforceWebhookSignature,
  WEBHOOK_CONFIG,
  type SalesforceWebhookEvent,
} from "@/lib/connectors/salesforce/webhook";
