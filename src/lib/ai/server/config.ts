import "server-only";

import type { AIProviderId } from "@/lib/ai/types";

export type AIConfig = {
  providerId: AIProviderId;
  openaiApiKey: string | undefined;
  openaiModel: string;
  isDevelopment: boolean;
};

/** Read AI configuration from server environment — never expose to the client. */
export function getAIConfig(): AIConfig {
  const rawProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const providerId: AIProviderId =
    rawProvider === "disabled"
      ? "placeholder"
      : rawProvider === "openai" ||
          rawProvider === "anthropic" ||
          rawProvider === "gemini" ||
          rawProvider === "azure_openai" ||
          rawProvider === "local"
        ? rawProvider
        : rawProvider === "placeholder"
          ? "placeholder"
          : process.env.OPENAI_API_KEY
            ? "openai"
            : "placeholder";

  return {
    providerId,
    openaiApiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
    openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    isDevelopment: process.env.NODE_ENV === "development",
  };
}

export function getMissingOpenAIMessage(): string {
  return "OPENAI_API_KEY is not configured. Set it in your server environment to enable real AI generation.";
}
