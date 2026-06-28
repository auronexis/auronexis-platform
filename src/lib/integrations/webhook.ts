import type { HttpMethod, IntegrationRequestPreview } from "@/lib/integrations/types";
import { buildHttpRequest, type HttpAuthConfig } from "@/lib/integrations/http";
import { validateIntegrationConfig } from "@/lib/integrations/validation";

export type WebhookAuthConfig = HttpAuthConfig;

export type WebhookRequestConfig = {
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: WebhookAuthConfig;
  timeoutMs?: number;
  retryCount?: number;
  templateContext?: Record<string, unknown>;
};

const SUPPORTED_WEBHOOK_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function buildWebhookRequest(config: WebhookRequestConfig): IntegrationRequestPreview {
  const method = config.method ?? "POST";
  if (!SUPPORTED_WEBHOOK_METHODS.includes(method)) {
    throw new Error(`Unsupported webhook method: ${method}`);
  }

  return buildHttpRequest({ ...config, method });
}

export function validateWebhookConfig(config: unknown) {
  const base = validateIntegrationConfig(config, ["url"]);
  if (!base.valid) {
    return base;
  }

  const record = config as Record<string, unknown>;
  const method = (record.method as HttpMethod | undefined) ?? "POST";
  if (!SUPPORTED_WEBHOOK_METHODS.includes(method)) {
    return {
      valid: false,
      errors: [{ field: "method", message: `Method must be one of ${SUPPORTED_WEBHOOK_METHODS.join(", ")}.` }],
    };
  }

  return base;
}

export function getSupportedWebhookMethods(): HttpMethod[] {
  return [...SUPPORTED_WEBHOOK_METHODS];
}
