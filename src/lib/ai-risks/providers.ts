import "server-only";

import type { AIProvider } from "@/lib/ai/providers/types";
import { placeholderAIProvider } from "@/lib/ai/providers/placeholder";
import { createOpenAIProvider } from "@/lib/ai/providers/openai";
import { getAIConfig } from "@/lib/ai/server/config";
import type { RiskAIProviderName } from "@/lib/ai-risks/types";

export type ResolvedRiskAIProvider = {
  provider: AIProvider | null;
  providerName: RiskAIProviderName;
  model: string;
  disabled: boolean;
  devNotice: string | null;
};

/** Resolve risk AI provider from existing AI settings. */
export function resolveRiskAIProvider(): ResolvedRiskAIProvider {
  const config = getAIConfig();

  if (config.providerId === "placeholder" && process.env.AI_PROVIDER?.trim().toLowerCase() === "disabled") {
    return {
      provider: null,
      providerName: "Disabled",
      model: "disabled",
      disabled: true,
      devNotice: "AI risk assistant is disabled.",
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
    model: "mock-risk-v1",
    disabled: false,
    devNotice:
      config.providerId === "openai" && !config.openaiApiKey
        ? "OpenAI key missing — using mock provider."
        : null,
  };
}
