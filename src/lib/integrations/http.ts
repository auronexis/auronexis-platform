import type { HttpAuthType, HttpMethod, IntegrationRequestPreview } from "@/lib/integrations/types";
import {
  applyTemplateVariables,
  applyTemplateVariablesToBody,
  applyTemplateVariablesToRecord,
  extractSecretReferences,
} from "@/lib/integrations/templates";
import { resolveSecretReferences } from "@/lib/integrations/secrets/references";
import { validateIntegrationConfig } from "@/lib/integrations/validation";

export type HttpAuthConfig = {
  type: HttpAuthType;
  tokenSecretId?: string;
  usernameSecretId?: string;
  passwordSecretId?: string;
  apiKeyHeader?: string;
  apiKeySecretId?: string;
};

export type HttpRequestConfig = {
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: HttpAuthConfig;
  timeoutMs?: number;
  retryCount?: number;
  templateContext?: Record<string, unknown>;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_COUNT = 0;

export function buildHttpRequest(config: HttpRequestConfig): IntegrationRequestPreview {
  const validation = validateIntegrationConfig(config, config.url ? [] : ["url"]);
  if (!validation.valid && !config.url) {
    return buildDefaultRequestPreview({ ...config, url: "https://example.com/unconfigured" });
  }

  return buildDefaultRequestPreview(config);
}

export function buildDefaultRequestPreview(config: HttpRequestConfig): IntegrationRequestPreview {
  const context = config.templateContext ?? {};
  const url = applyTemplateVariables(config.url ?? "https://example.com/simulated", context);
  const headers = applyTemplateVariablesToRecord(config.headers ?? { "Content-Type": "application/json" }, context);
  const authHeaders = buildAuthHeaders(config.auth);
  const mergedHeaders = { ...headers, ...authHeaders };
  const body = applyTemplateVariablesToBody(config.body ?? { simulated: true }, context);
  const secretReferences = extractSecretReferences(config);

  if (secretReferences.length > 0) {
    resolveSecretReferences(secretReferences);
  }

  return {
    method: config.method ?? "POST",
    url,
    headers: mergedHeaders,
    body,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retryCount: config.retryCount ?? DEFAULT_RETRY_COUNT,
  };
}

function buildAuthHeaders(auth?: HttpAuthConfig): Record<string, string> {
  if (!auth || auth.type === "none") {
    return {};
  }

  switch (auth.type) {
    case "bearer":
      return { Authorization: "Bearer [secret:token]" };
    case "basic":
      return { Authorization: "Basic [secret:credentials]" };
    case "api_key": {
      const header = auth.apiKeyHeader ?? "X-API-Key";
      return { [header]: "[secret:api_key]" };
    }
    default:
      return {};
  }
}

export function validateHttpRequestConfig(config: unknown) {
  return validateIntegrationConfig(config, ["url"]);
}
