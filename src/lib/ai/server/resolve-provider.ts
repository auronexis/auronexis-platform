import "server-only";

import type { AIProvider } from "@/lib/ai/providers/types";
import { placeholderAIProvider } from "@/lib/ai/providers/placeholder";
import { createOpenAIProvider } from "@/lib/ai/providers/openai";
import { getAIConfig, getMissingOpenAIMessage } from "@/lib/ai/server/config";

export type ResolveAIProviderResult = {
  provider: AIProvider;
  devNotice: string | null;
};

/** Resolve the active server-side AI provider from environment configuration. */
export function resolveAIProvider(): ResolveAIProviderResult {
  const config = getAIConfig();
  let devNotice: string | null = null;

  if (config.providerId === "openai") {
    if (!config.openaiApiKey) {
      if (config.isDevelopment) {
        devNotice = getMissingOpenAIMessage();
        console.warn(`[AI] ${devNotice}`);
      }

      return { provider: placeholderAIProvider, devNotice };
    }

    return {
      provider: createOpenAIProvider(config.openaiApiKey, config.openaiModel),
      devNotice: null,
    };
  }

  return { provider: placeholderAIProvider, devNotice: null };
}
