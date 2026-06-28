/** Enterprise integration platform types. */

export type IntegrationDeliveryStatus =
  | "queued"
  | "sending"
  | "delivered"
  | "failed"
  | "rate_limited"
  | "retrying"
  | "dead_letter";

export type IntegrationProviderId =
  | "slack"
  | "microsoft_teams"
  | "discord"
  | "webhook"
  | "rest_api"
  | "email"
  | "jira"
  | "github"
  | "notion"
  | "linear"
  | "azure_devops"
  | "google_chat";

export type IntegrationHealthStatus =
  | "configured"
  | "missing_credentials"
  | "invalid_config"
  | "disabled"
  | "simulation_available";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type HttpAuthType = "none" | "bearer" | "basic" | "api_key";

export type IntegrationValidationError = {
  field: string;
  message: string;
};

export type IntegrationValidationResult = {
  valid: boolean;
  errors: IntegrationValidationError[];
};

export type IntegrationSecretReference = {
  secretId: string;
  label?: string;
};

export type IntegrationRequestPreview = {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  timeoutMs: number;
  retryCount: number;
};

export type IntegrationSimulationResult = {
  providerId: IntegrationProviderId;
  providerName: string;
  simulated: true;
  requestPreview: IntegrationRequestPreview;
  validationErrors: IntegrationValidationError[];
  durationMs: number;
  message: string;
  secretReferenceStatus: "present" | "missing" | "not_required";
};

export type IntegrationHealthSnapshot = {
  providerId: IntegrationProviderId;
  providerName: string;
  status: IntegrationHealthStatus;
  simulationSupported: boolean;
  configured: boolean;
  missingSecretIds: string[];
  configuredSecretCount: number;
  notes: string[];
};

export type IntegrationSimulateInput = {
  config?: Record<string, unknown>;
  templateContext?: Record<string, unknown>;
  secretReferences?: IntegrationSecretReference[];
};

export type IntegrationExecuteInput = IntegrationSimulateInput & {
  organizationId: string;
  secretId?: string | null;
  workflowId?: string;
  workflowExecutionId?: string;
  actionId?: string;
  forceSimulation?: boolean;
};

export type IntegrationExecutionResult = {
  providerId: IntegrationProviderId;
  providerName: string;
  deliveryStatus: IntegrationDeliveryStatus;
  success: boolean;
  simulated: boolean;
  durationMs: number;
  message: string;
  responseCode?: number;
  latencyMs?: number;
  retryCount: number;
  deliveryId?: string;
  providerMessageId?: string;
  validationErrors: IntegrationValidationError[];
  secretReferenceStatus: "present" | "missing" | "not_required";
  logId?: string;
  failureReason?: string;
};

export type IntegrationProvider = {
  id: IntegrationProviderId;
  name: string;
  description: string;
  category: "messaging" | "webhook" | "api" | "email" | "issue_tracking" | "documentation";
  supportedActions: string[];
  liveExecutionSupported: boolean;
  validate(config: unknown): IntegrationValidationResult;
  simulate(input: IntegrationSimulateInput): IntegrationSimulationResult;
  execute(input: IntegrationExecuteInput): Promise<IntegrationExecutionResult>;
  health(config?: unknown): IntegrationHealthSnapshot;
};

export type IntegrationRuntimeDiagnosticsSnapshot = {
  activeProviders: number;
  successfulToday: number;
  failedToday: number;
  retryingCount: number;
  deadLetterCount: number;
  averageLatencyMs: number | null;
  rateLimitedToday: number;
  queueSize: number;
};

export type IntegrationRuntimeDashboardSummary = {
  running: number;
  failed: number;
  retrying: number;
  deliveredToday: number;
  averageLatencyMs: number | null;
};

export type IntegrationDeliveryLogView = {
  id: string;
  providerId: string;
  workflowId: string | null;
  workflowExecutionId: string | null;
  actionId: string | null;
  status: IntegrationDeliveryStatus;
  retryCount: number;
  responseCode: number | null;
  latencyMs: number | null;
  failureReason: string | null;
  providerMessageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IntegrationDiagnosticsSnapshot = {
  registeredProviderCount: number;
  registeredProviders: Array<{
    id: IntegrationProviderId;
    name: string;
    simulationSupported: boolean;
    status: IntegrationHealthStatus;
  }>;
  configuredProviderCount: number;
  readyProviderCount: number;
  missingSecretCount: number;
  simulationEnabled: boolean;
};

export type IntegrationsDashboardSummary = {
  registeredCount: number;
  configuredCount: number;
  readyCount: number;
  simulationStatus: "available" | "disabled";
  workflowIntegrationActionCount: number;
};
