import { BaseIntegrationProvider } from "@/lib/integrations/base";
import { LiveHttpIntegrationProvider } from "@/lib/integrations/providers/live-http";
import { registerIntegrationProvider } from "@/lib/integrations/registry";

const LIVE_PROVIDER_IDS = new Set(["slack", "microsoft_teams", "discord", "webhook"]);

const PROVIDER_DEFINITIONS = [
  {
    id: "slack" as const,
    name: "Slack",
    description: "Send messages to Slack channels via incoming webhooks or API.",
    category: "messaging" as const,
    supportedActions: ["send_slack_message"],
    defaultUrl: "https://hooks.slack.com/services/simulated",
    requiredFields: ["secretId"],
  },
  {
    id: "microsoft_teams" as const,
    name: "Microsoft Teams",
    description: "Post adaptive cards and messages to Teams channels.",
    category: "messaging" as const,
    supportedActions: ["send_teams_message"],
    defaultUrl: "https://outlook.office.com/webhook/simulated",
    requiredFields: ["secretId"],
  },
  {
    id: "discord" as const,
    name: "Discord",
    description: "Send notifications to Discord channels.",
    category: "messaging" as const,
    supportedActions: ["send_discord_notification"],
    defaultUrl: "https://discord.com/api/webhooks/simulated",
    requiredFields: ["secretId"],
  },
  {
    id: "webhook" as const,
    name: "Webhook",
    description: "Generic outbound webhook delivery with auth and retries.",
    category: "webhook" as const,
    supportedActions: ["post_webhook"],
    defaultUrl: "https://example.com/webhook/simulated",
    requiredFields: ["url", "secretId"],
  },
  {
    id: "rest_api" as const,
    name: "REST API",
    description: "Configurable REST API calls with headers and authentication.",
    category: "api" as const,
    supportedActions: ["rest_api_call"],
    defaultUrl: "https://api.example.com/simulated",
  },
  {
    id: "email" as const,
    name: "Email",
    description: "Send transactional email notifications.",
    category: "email" as const,
    supportedActions: ["send_email"],
    defaultUrl: "smtp://mail.example.com/simulated",
    defaultMethod: "POST" as const,
  },
  {
    id: "jira" as const,
    name: "Jira",
    description: "Create and update Jira issues.",
    category: "issue_tracking" as const,
    supportedActions: ["create_jira_issue"],
    defaultUrl: "https://your-domain.atlassian.net/rest/api/3/issue/simulated",
  },
  {
    id: "github" as const,
    name: "GitHub",
    description: "Create GitHub issues and comments.",
    category: "issue_tracking" as const,
    supportedActions: ["create_github_issue"],
    defaultUrl: "https://api.github.com/repos/org/repo/issues/simulated",
  },
  {
    id: "notion" as const,
    name: "Notion",
    description: "Create pages and database entries in Notion.",
    category: "documentation" as const,
    supportedActions: ["create_notion_page"],
    defaultUrl: "https://api.notion.com/v1/pages/simulated",
  },
  {
    id: "linear" as const,
    name: "Linear",
    description: "Create Linear tickets from workflow events.",
    category: "issue_tracking" as const,
    supportedActions: ["create_linear_ticket"],
    defaultUrl: "https://api.linear.app/graphql/simulated",
  },
  {
    id: "azure_devops" as const,
    name: "Azure DevOps",
    description: "Create work items in Azure DevOps boards.",
    category: "issue_tracking" as const,
    supportedActions: ["create_azure_devops_work_item"],
    defaultUrl: "https://dev.azure.com/org/project/_apis/wit/workitems/simulated",
  },
  {
    id: "google_chat" as const,
    name: "Google Chat",
    description: "Send messages to Google Chat spaces.",
    category: "messaging" as const,
    supportedActions: ["send_google_chat_message"],
    defaultUrl: "https://chat.googleapis.com/v1/spaces/simulated/messages",
  },
] as const;

let providersBootstrapped = false;

export function bootstrapIntegrationProviders(): void {
  if (providersBootstrapped) {
    return;
  }

  for (const definition of PROVIDER_DEFINITIONS) {
    if (LIVE_PROVIDER_IDS.has(definition.id)) {
      registerIntegrationProvider(new LiveHttpIntegrationProvider(definition));
    } else {
      registerIntegrationProvider(new BaseIntegrationProvider(definition));
    }
  }

  providersBootstrapped = true;
}

export { PROVIDER_DEFINITIONS };
