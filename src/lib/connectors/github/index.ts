export type { GithubResource, GithubConnectorConfig } from "@/lib/connectors/github/types";
export { GITHUB_CONFIG } from "@/lib/connectors/github/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/github/auth";
export { createGithubClient } from "@/lib/connectors/github/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/github/mapper";
export { checkGithubHealth } from "@/lib/connectors/github/health";
export { syncGithub } from "@/lib/connectors/github/sync";
export {
  parseGithubWebhook,
  validateGithubWebhookSignature,
  WEBHOOK_CONFIG,
  type GithubWebhookEvent,
} from "@/lib/connectors/github/webhook";
