import type { IntegrationValidationError, IntegrationValidationResult } from "@/lib/integrations/types";
import { validateOutboundUrl } from "@/lib/security/outbound-url";

export function validateIntegrationConfig(
  config: unknown,
  requiredFields: string[] = [],
): IntegrationValidationResult {
  const errors: IntegrationValidationError[] = [];

  if (config != null && typeof config !== "object") {
    return {
      valid: false,
      errors: [{ field: "config", message: "Configuration must be an object." }],
    };
  }

  const record = (config ?? {}) as Record<string, unknown>;

  for (const field of requiredFields) {
    const value = record[field];
    if (value == null || (typeof value === "string" && value.trim() === "")) {
      errors.push({ field, message: `${field} is required.` });
    }
  }

  if (record.timeoutMs != null && typeof record.timeoutMs === "number" && record.timeoutMs < 0) {
    errors.push({ field: "timeoutMs", message: "Timeout must be zero or positive." });
  }

  if (record.retryCount != null && typeof record.retryCount === "number" && record.retryCount < 0) {
    errors.push({ field: "retryCount", message: "Retry count must be zero or positive." });
  }

  if (record.url != null && typeof record.url === "string" && record.url.trim() !== "") {
    const outbound = validateOutboundUrl(record.url);
    if (!outbound.ok) {
      errors.push({ field: "url", message: outbound.reason });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function mergeValidationResults(
  ...results: IntegrationValidationResult[]
): IntegrationValidationResult {
  const errors = results.flatMap((result) => result.errors);
  return { valid: errors.length === 0, errors };
}
