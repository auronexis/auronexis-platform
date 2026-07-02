import type { AIProviderId } from "@/lib/ai/types";

function isAiExplicitlyDisabled(): boolean {
  return process.env.AI_PROVIDER?.trim().toLowerCase() === "disabled";
}

/** Human-readable provider label for diagnostics and admin UI. */
export function formatAIProviderLabel(
  providerId: string,
  options?: { isDevelopment?: boolean },
): string {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV !== "production";

  if (isAiExplicitlyDisabled()) {
    return "Disabled";
  }

  switch (providerId as AIProviderId) {
    case "openai":
      return "OpenAI";
    case "anthropic":
      return "Anthropic";
    case "placeholder":
      return isDevelopment ? "Mock (development)" : "Disabled";
    default:
      return providerId.charAt(0).toUpperCase() + providerId.slice(1);
  }
}

/** Provider health summary for diagnostics. */
export function formatAIProviderHealthMessage(
  providerId: string,
  options?: { isDevelopment?: boolean },
): string {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV !== "production";

  if (isAiExplicitlyDisabled()) {
    return "Disabled";
  }

  switch (providerId as AIProviderId) {
    case "openai":
      return "OpenAI provider active";
    case "anthropic":
      return "Anthropic provider active";
    case "placeholder":
      return isDevelopment ? "Mock provider active" : "No provider configured";
    default:
      return `${formatAIProviderLabel(providerId, options)} provider active`;
  }
}

export function isAIProviderConfigured(providerId: string): boolean {
  if (isAiExplicitlyDisabled()) {
    return false;
  }

  return providerId !== "placeholder";
}
