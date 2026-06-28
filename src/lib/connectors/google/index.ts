export type { GoogleResource, GoogleConnectorConfig } from "@/lib/connectors/google/types";
export { GOOGLE_CONFIG } from "@/lib/connectors/google/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/google/auth";
export { createGoogleClient } from "@/lib/connectors/google/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/google/mapper";
export { checkGoogleHealth } from "@/lib/connectors/google/health";
export { syncGoogle } from "@/lib/connectors/google/sync";
export {
  parseGoogleWebhook,
  validateGoogleWebhookSignature,
  WEBHOOK_CONFIG,
  type GoogleWebhookEvent,
} from "@/lib/connectors/google/webhook";
