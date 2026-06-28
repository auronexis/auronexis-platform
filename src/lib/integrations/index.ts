export type {
  HttpAuthType,
  HttpMethod,
  IntegrationDiagnosticsSnapshot,
  IntegrationHealthSnapshot,
  IntegrationHealthStatus,
  IntegrationProvider,
  IntegrationProviderId,
  IntegrationRequestPreview,
  IntegrationSecretReference,
  IntegrationSimulateInput,
  IntegrationSimulationResult,
  IntegrationValidationError,
  IntegrationValidationResult,
  IntegrationsDashboardSummary,
} from "@/lib/integrations/types";

export { BaseIntegrationProvider } from "@/lib/integrations/base";
export {
  freezeIntegrationRegistry,
  getIntegrationProvider,
  getIntegrationProviderCount,
  isIntegrationProviderRegistered,
  listIntegrationProviders,
  registerIntegrationProvider,
} from "@/lib/integrations/registry";
export { validateIntegrationConfig, mergeValidationResults } from "@/lib/integrations/validation";
export {
  buildWebhookRequest,
  getSupportedWebhookMethods,
  validateWebhookConfig,
  type WebhookRequestConfig,
} from "@/lib/integrations/webhook";
export {
  buildHttpRequest,
  buildDefaultRequestPreview,
  validateHttpRequestConfig,
  type HttpAuthConfig,
  type HttpRequestConfig,
} from "@/lib/integrations/http";
export {
  applyTemplateVariables,
  applyTemplateVariablesToBody,
  applyTemplateVariablesToRecord,
  extractSecretReferences,
} from "@/lib/integrations/templates";
export {
  maskSecretValue,
  redactSecretFields,
  sanitizeLogPayload,
} from "@/lib/integrations/secrets/masking";
export {
  collectMissingSecretIds,
  extractSecretIdFromConfig,
  resolveSecretReference,
  resolveSecretReferences,
  type SecretResolutionResult,
} from "@/lib/integrations/secrets/references";
export { evaluateProviderHealth, summarizeHealthStatuses } from "@/lib/integrations/health";
export {
  formatSimulationSummary,
  getIntegrationsDiagnostics,
  getProviderIdForAction,
  INTEGRATION_ACTION_TYPES,
  isIntegrationActionType,
  simulateIntegration,
  simulateWorkflowIntegrationAction,
  type IntegrationWorkflowActionType,
} from "@/lib/integrations/simulation";
export { bootstrapIntegrationProviders, PROVIDER_DEFINITIONS } from "@/lib/integrations/providers";
export { getIntegrationsDashboardSummary } from "@/lib/integrations/queries";

import { bootstrapIntegrationProviders } from "@/lib/integrations/providers";
import { freezeIntegrationRegistry } from "@/lib/integrations/registry";

bootstrapIntegrationProviders();
freezeIntegrationRegistry();
