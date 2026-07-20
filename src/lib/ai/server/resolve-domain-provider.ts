import "server-only";

import type { AIProvider } from "@/lib/ai/providers/types";
import { placeholderAIProvider } from "@/lib/ai/providers/placeholder";
import { createOpenAIProvider } from "@/lib/ai/providers/openai";
import { getAIConfig } from "@/lib/ai/server/config";

export type DomainAIProviderName = "OpenAI" | "Anthropic" | "Mock" | "Disabled";

export type ResolvedDomainAIProvider = {
  provider: AIProvider | null;
  providerName: DomainAIProviderName;
  model: string;
  disabled: boolean;
  devNotice: string | null;
};

type ResolveDomainAIProviderOptions = {
  mockModel: string;
  disabledNotice: string;
};

/**
 * Shared resolver for domain AI assistants (risks, incidents, etc.).
 * Preserves the previous per-module resolution outcomes.
 */
export function resolveDomainAIProvider(
  options: ResolveDomainAIProviderOptions,
): ResolvedDomainAIProvider {
  const config = getAIConfig();

  if (
    config.providerId === "placeholder" &&
    process.env.AI_PROVIDER?.trim().toLowerCase() === "disabled"
  ) {
    return {
      provider: null,
      providerName: "Disabled",
      model: "disabled",
      disabled: true,
      devNotice: options.disabledNotice,
    };
  }

  if (config.providerId === "openai" && config.openaiApiKey) {
    return {
      provider: createOpenAIProvider(config.openaiApiKey, config.openaiModel),
      providerName: "OpenAI",
      model: config.openaiModel,
      disabled: false,
      devNotice: null,
    };
  }

  if (config.providerId === "anthropic") {
    return {
      provider: placeholderAIProvider,
      providerName: "Anthropic",
      model: "claude-mock",
      disabled: false,
      devNotice: "Anthropic provider not fully configured — using mock output.",
    };
  }

  return {
    provider: placeholderAIProvider,
    providerName: "Mock",
    model: options.mockModel,
    disabled: false,
    devNotice:
      config.providerId === "openai" && !config.openaiApiKey
        ? "OpenAI key missing — using mock provider."
        : null,
  };
}
