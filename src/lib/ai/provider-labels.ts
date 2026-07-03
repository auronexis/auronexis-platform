import type { AIProviderId } from "@/lib/ai/types";

function isAiExplicitlyDisabled(): boolean {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "disabled";
}

type ProviderLabelOptions = {
  isDevelopment?: boolean;
  openaiKeyPresent?: boolean;
  anthropicKeyPresent?: boolean;
};

/** Human-readable provider label for diagnostics and admin UI. */
export function formatAIProviderLabel(
  providerId: string,
  options?: ProviderLabelOptions,
): string {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV !== "production";

  if (isAiExplicitlyDisabled()) {
    return "AI disabled";
  }

  switch (providerId as AIProviderId) {
    case "openai":
      return options?.openaiKeyPresent === false ? "Missing API configuration" : "OpenAI configured";
    case "anthropic":
      return options?.anthropicKeyPresent === false ? "Missing API configuration" : "Anthropic configured";
    case "placeholder":
      return isDevelopment ? "Mock provider active" : "AI disabled";
    default:
      return "Provider unavailable";
  }
}

/** Provider health summary for diagnostics. */
export function formatAIProviderHealthMessage(
  providerId: string,
  options?: ProviderLabelOptions,
): string {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV !== "production";

  if (isAiExplicitlyDisabled()) {
    return "AI disabled";
  }

  switch (providerId as AIProviderId) {
    case "openai":
      return options?.openaiKeyPresent === false ? "Missing API configuration" : "OpenAI configured";
    case "anthropic":
      return options?.anthropicKeyPresent === false ? "Missing API configuration" : "Anthropic configured";
    case "placeholder":
      return isDevelopment ? "Mock provider active" : "Missing API configuration";
    default:
      return "Provider unavailable";
  }
}

export function isAIProviderConfigured(providerId: string): boolean {
  if (isAiExplicitlyDisabled()) {
    return false;
  }

  return providerId !== "placeholder";
}

export function resolveAIReadinessStatus(
  providerId: string,
  options?: ProviderLabelOptions,
): { status: string; provider: string } {
  if (!isAIProviderConfigured(providerId)) {
    return {
      status: "AI disabled",
      provider: formatAIProviderLabel(providerId, options),
    };
  }

  return {
    status: "Active",
    provider: formatAIProviderLabel(providerId, options),
  };
}
