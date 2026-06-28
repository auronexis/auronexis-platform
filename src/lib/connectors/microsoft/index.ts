export type { MicrosoftResource, MicrosoftConnectorConfig } from "@/lib/connectors/microsoft/types";
export { MICROSOFT_CONFIG } from "@/lib/connectors/microsoft/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/microsoft/auth";
export { createMicrosoftClient } from "@/lib/connectors/microsoft/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/microsoft/mapper";
export { checkMicrosoftHealth } from "@/lib/connectors/microsoft/health";
export { syncMicrosoft } from "@/lib/connectors/microsoft/sync";
export {
  parseMicrosoftWebhook,
  validateMicrosoftWebhookSignature,
  WEBHOOK_CONFIG,
  type MicrosoftWebhookEvent,
} from "@/lib/connectors/microsoft/webhook";
