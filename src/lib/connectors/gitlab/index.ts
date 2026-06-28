export type { GitlabResource, GitlabConnectorConfig } from "@/lib/connectors/gitlab/types";
export { GITLAB_CONFIG } from "@/lib/connectors/gitlab/types";
export {
  AUTH_CONFIG,
  buildAuthorizationUrl,
  getOAuthEnvKeys,
  isAuthConfigured,
} from "@/lib/connectors/gitlab/auth";
export { createGitlabClient } from "@/lib/connectors/gitlab/client";
export { mapExternalRecord, mapExternalRecords } from "@/lib/connectors/gitlab/mapper";
export { checkGitlabHealth } from "@/lib/connectors/gitlab/health";
export { syncGitlab } from "@/lib/connectors/gitlab/sync";
export {
  parseGitlabWebhook,
  validateGitlabWebhookSignature,
  WEBHOOK_CONFIG,
  type GitlabWebhookEvent,
} from "@/lib/connectors/gitlab/webhook";
