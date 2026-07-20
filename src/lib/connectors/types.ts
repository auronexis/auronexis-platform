/** Enterprise connector platform types. */

export type ConnectorId =
  | "google"
  | "microsoft"
  | "jira"
  | "github"
  | "gitlab"
  | "notion"
  | "slack"
  | "teams"
  | "linear"
  | "hubspot"
  | "salesforce"
  | "zendesk"
  | "clickup";

export const CONNECTOR_IDS: readonly ConnectorId[] = [
  "google",
  "microsoft",
  "jira",
  "github",
  "gitlab",
  "notion",
  "slack",
  "teams",
  "linear",
  "hubspot",
  "salesforce",
  "zendesk",
  "clickup",
] as const;

export function isConnectorId(value: string): value is ConnectorId {
  return (CONNECTOR_IDS as readonly string[]).includes(value);
}
export type ConnectorConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "revoked"
  | "expired";

export type ConnectorHealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export type ConnectorSyncType = "manual" | "scheduled" | "incremental" | "full";

export type ConnectorSyncStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type ConnectorOAuthCapability = "none" | "oauth2" | "oauth2_pkce";

export type ConnectorDefinition = {
  id: ConnectorId;
  version: string;
  name: string;
  description: string;
  category: "productivity" | "devops" | "crm" | "helpdesk" | "messaging" | "workspace";
  supportedActions: readonly string[];
  supportedTriggers: readonly string[];
  oauth: ConnectorOAuthCapability;
  webhooks: boolean;
  health: boolean;
  services?: readonly string[];
};

export type ConnectorHealthResult = {
  connectorId: ConnectorId;
  status: ConnectorHealthStatus;
  connected: boolean;
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  messages: string[];
  apiQuotaRemaining?: number | null;
};

export type ConnectorConnectionView = {
  id: string;
  connectorId: ConnectorId;
  connectorVersion: string;
  displayName: string;
  status: ConnectorConnectionStatus;
  scopes: string[];
  tokenExpiresAt: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  healthStatus: ConnectorHealthStatus;
  createdAt: string;
  updatedAt: string;
};

export type ConnectorSyncJobView = {
  id: string;
  connectionId: string;
  connectorId: ConnectorId;
  syncType: ConnectorSyncType;
  status: ConnectorSyncStatus;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  recordsChanged: number;
  errorMessage: string | null;
  createdAt: string;
};

export type ConnectorsDashboardSnapshot = {
  registeredCount: number;
  connectedCount: number;
  healthyCount: number;
  expiringSoonCount: number;
  lastSyncFailures: number;
  connectors: Array<{
    definition: ConnectorDefinition;
    connection: ConnectorConnectionView | null;
    health: ConnectorHealthResult;
  }>;
};

export type ConnectorDiagnosticsRow = {
  connectorId: ConnectorId;
  name: string;
  connected: boolean;
  oauthConfigured: boolean;
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  healthStatus: ConnectorHealthStatus;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
};

export type ConnectorsDiagnosticsSnapshot = {
  registeredConnectors: number;
  connectedProviders: number;
  oauthConfiguredConnectors: number;
  validTokens: number;
  expiredTokens: number;
  refreshFailures: number;
  lastSyncAt: string | null;
  unhealthyConnections: number;
  apiQuotaAvailable: boolean;
  providers: ConnectorDiagnosticsRow[];
};

export const CONNECTOR_PLATFORM_VERSION = "connectors-v1";
