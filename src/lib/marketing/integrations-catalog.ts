export type IntegrationStatus =
  | "connected"
  | "available"
  | "optional"
  | "planned"
  | "enterprise";

export type IntegrationSectionKey = "connected" | "available" | "coming_soon";

export type IntegrationCatalogItem = {
  id: string;
  title: string;
  description: string;
  status: IntegrationStatus;
  section: IntegrationSectionKey;
};

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: "Connected",
  available: "Available",
  optional: "Optional",
  planned: "Planned",
  enterprise: "Enterprise",
};

export const INTEGRATION_SECTION_LABELS: Record<IntegrationSectionKey, string> = {
  connected: "Connected",
  available: "Available",
  coming_soon: "Coming soon",
};

export const INTEGRATION_CATALOG: IntegrationCatalogItem[] = [
  {
    id: "paddle",
    title: "Paddle",
    description: "Merchant of Record for subscription billing, checkout, customer portal, and invoice sync.",
    status: "connected",
    section: "connected",
  },
  {
    id: "supabase",
    title: "Supabase",
    description: "Authentication, Postgres database, row-level security, and realtime workspace data.",
    status: "connected",
    section: "connected",
  },
  {
    id: "openai",
    title: "OpenAI",
    description: "AI report assistant, executive summaries, and automation content generation.",
    status: "available",
    section: "available",
  },
  {
    id: "slack",
    title: "Slack",
    description: "Workflow notifications, incident alerts, and automation delivery to team channels.",
    status: "available",
    section: "available",
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "Outbound HTTP events for billing, reports, risks, and custom automation triggers.",
    status: "available",
    section: "available",
  },
  {
    id: "anthropic",
    title: "Anthropic",
    description: "Optional Claude provider for AI-assisted reporting and knowledge workflows.",
    status: "optional",
    section: "available",
  },
  {
    id: "teams",
    title: "Microsoft Teams",
    description: "Channel notifications and operational updates for Microsoft-first agencies.",
    status: "planned",
    section: "coming_soon",
  },
  {
    id: "zapier",
    title: "Zapier",
    description: "No-code automation bridges to CRM, ticketing, and productivity tools.",
    status: "planned",
    section: "coming_soon",
  },
  {
    id: "api-access",
    title: "API Access",
    description: "REST API for clients, reports, risks, incidents, and integrations on Enterprise plans.",
    status: "enterprise",
    section: "coming_soon",
  },
];

export const INTEGRATION_SECTION_ORDER: IntegrationSectionKey[] = [
  "connected",
  "available",
  "coming_soon",
];

export function getIntegrationsBySection(section: IntegrationSectionKey): IntegrationCatalogItem[] {
  return INTEGRATION_CATALOG.filter((item) => item.section === section);
}
