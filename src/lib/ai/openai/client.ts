import "server-only";

import OpenAI from "openai";
import { getOpenAIPlatformConfig } from "@/lib/ai/openai/config";

let cachedClient: OpenAI | null = null;
let cachedKey: string | undefined;

/** Single server-only OpenAI client factory. */
export function getOpenAIClient(): OpenAI | null {
  const config = getOpenAIPlatformConfig();
  if (!config.apiKey || config.state === "disabled" || config.state === "not_configured") {
    return null;
  }

  if (cachedClient && cachedKey === config.apiKey) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey: config.apiKey,
    timeout: config.timeoutMs,
  });
  cachedKey = config.apiKey;
  return cachedClient;
}

export function resetOpenAIClientForTests(): void {
  cachedClient = null;
  cachedKey = undefined;
}
