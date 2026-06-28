/** Client-safe provider labels for integration secret forms. */

export const INTEGRATION_PROVIDER_OPTIONS = [
  { id: "slack", name: "Slack" },
  { id: "microsoft_teams", name: "Microsoft Teams" },
  { id: "discord", name: "Discord" },
  { id: "webhook", name: "Webhook" },
  { id: "rest_api", name: "REST API" },
  { id: "email", name: "Email" },
  { id: "jira", name: "Jira" },
  { id: "github", name: "GitHub" },
  { id: "notion", name: "Notion" },
  { id: "linear", name: "Linear" },
  { id: "azure_devops", name: "Azure DevOps" },
  { id: "google_chat", name: "Google Chat" },
] as const;
