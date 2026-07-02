/** Public API platform types. */

export type ApiVersion = "v1";

export type ApiKeyType = "personal" | "workspace";

export type ApiKeyStatus = "active" | "revoked" | "expired";

export type ApiScope =
  | "clients.read"
  | "clients.write"
  | "reports.read"
  | "reports.write"
  | "risks.read"
  | "risks.write"
  | "incidents.read"
  | "incidents.write"
  | "health.read"
  | "activity.read"
  | "webhooks.write"
  | "automation.read"
  | "automation.write"
  | "ai.execute"
  | "predictive.read"
  | "billing.read"
  | "settings.read"
  | "integrations.read"
  | "integrations.write";

export type ApiKeyView = {
  id: string;
  organizationId: string;
  keyType: ApiKeyType;
  name: string;
  keyPrefix: string;
  scopes: ApiScope[];
  status: ApiKeyStatus;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiKeyCreateResult = ApiKeyView & {
  plaintextKey: string;
};

export type ApiWebhookEndpointView = {
  id: string;
  organizationId: string;
  url: string;
  description: string | null;
  events: string[];
  status: "active" | "inactive" | "disabled";
  createdAt: string;
  updatedAt: string;
};

export type ApiWebhookDeliveryView = {
  id: string;
  endpointId: string;
  eventType: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  errorMessage: string | null;
  deliveredAt: string | null;
  createdAt: string;
};

export type ApiDashboardSnapshot = {
  activeKeyCount: number;
  revokedKeyCount: number;
  requestsToday: number;
  rateLimitedToday: number;
  failedRequestsToday: number;
  averageLatencyMs: number | null;
  webhookEndpointCount: number;
  webhookDeliveriesToday: number;
  keys: ApiKeyView[];
  webhookEndpoints: ApiWebhookEndpointView[];
  recentDeliveries: ApiWebhookDeliveryView[];
};

export type ApiDiagnosticsSnapshot = {
  openApiVersion: string;
  apiVersion: ApiVersion;
  requestsToday: number;
  averageLatencyMs: number | null;
  failedRequestsToday: number;
  rateLimitedToday: number;
  webhookDeliveriesToday: number;
  activeApiKeys: number;
  tableReachable: boolean;
};

export const API_PLATFORM_VERSION = "public-api-v1";
export const OPENAPI_VERSION = "3.1.0";

export const ALL_API_SCOPES: ApiScope[] = [
  "clients.read",
  "clients.write",
  "reports.read",
  "reports.write",
  "risks.read",
  "risks.write",
  "incidents.read",
  "incidents.write",
  "health.read",
  "activity.read",
  "webhooks.write",
  "automation.read",
  "automation.write",
  "ai.execute",
  "predictive.read",
  "billing.read",
  "settings.read",
  "integrations.read",
  "integrations.write",
];

export const API_SCOPE_LABELS: Record<ApiScope, string> = {
  "clients.read": "Read clients",
  "clients.write": "Write clients",
  "reports.read": "Read reports",
  "reports.write": "Write reports",
  "risks.read": "Read risks",
  "risks.write": "Write risks",
  "incidents.read": "Read incidents",
  "incidents.write": "Write incidents",
  "health.read": "Read health snapshots",
  "activity.read": "Read activity events",
  "webhooks.write": "Manage webhook endpoints",
  "automation.read": "Read automation",
  "automation.write": "Write automation",
  "ai.execute": "Execute AI",
  "predictive.read": "Read predictive intelligence",
  "billing.read": "Read billing",
  "settings.read": "Read settings",
  "integrations.read": "Read integrations",
  "integrations.write": "Write integrations",
};

export const API_WEBHOOK_EVENTS = [
  "client.created",
  "client.updated",
  "health.changed",
  "risk.created",
  "risk.updated",
  "incident.created",
  "incident.resolved",
  "report.published",
  "sla.breached",
  "monitoring.event_detected",
] as const;

export type ApiWebhookEvent = (typeof API_WEBHOOK_EVENTS)[number];
