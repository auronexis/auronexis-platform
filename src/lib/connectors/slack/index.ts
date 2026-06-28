export type { SlackResource, SlackConnectorConfig } from "@/lib/connectors/slack/types";
export { SLACK_CONFIG } from "@/lib/connectors/slack/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/slack/auth";
export { createSlackClient } from "@/lib/connectors/slack/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/slack/mapper";
export { checkSlackHealth } from "@/lib/connectors/slack/health";
export { syncSlack } from "@/lib/connectors/slack/sync";
export {
  parseSlackWebhook,
  validateSlackWebhookSignature,
  WEBHOOK_CONFIG,
  type SlackWebhookEvent,
} from "@/lib/connectors/slack/webhook";
