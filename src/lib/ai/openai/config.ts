import "server-only";

import type { OpenAIPlatformConfig, OpenAIPlatformState } from "@/lib/ai/openai/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1200;

function parseBooleanEnv(value: string | undefined): boolean | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return null;
}

function resolveBaseState(input: {
  enabled: boolean;
  provider: string;
  apiKey: string | undefined;
}): OpenAIPlatformState {
  if (!input.enabled) return "disabled";
  if (input.provider !== "openai") return "not_configured";
  if (!input.apiKey) return "not_configured";
  return "configured";
}

/** Canonical server-only OpenAI platform configuration. Never exposes secrets. */
export function getOpenAIPlatformConfig(): OpenAIPlatformConfig {
  const enabledFlag = parseBooleanEnv(process.env.AI_ENABLED);
  const enabled = enabledFlag === null ? true : enabledFlag;
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "openai";
  const apiKey = process.env.OPENAI_API_KEY?.trim() || undefined;
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS?.trim()) || DEFAULT_TIMEOUT_MS;
  const maxOutputTokens =
    Number(process.env.OPENAI_MAX_OUTPUT_TOKENS?.trim()) || DEFAULT_MAX_OUTPUT_TOKENS;

  return {
    enabled,
    provider,
    apiKey,
    model,
    timeoutMs,
    maxOutputTokens,
    state: resolveBaseState({ enabled, provider, apiKey }),
  };
}

export function withHealthState(
  config: OpenAIPlatformConfig,
  latestHealth: { ok: boolean } | null,
): OpenAIPlatformConfig {
  if (config.state === "disabled" || config.state === "not_configured") {
    return config;
  }
  if (!latestHealth) {
    return { ...config, state: "configured" };
  }
  return {
    ...config,
    state: latestHealth.ok ? "connected" : "degraded",
  };
}
