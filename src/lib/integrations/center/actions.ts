"use server";

import { createOpenAIProvider } from "@/lib/ai/providers/openai";
import { getAIConfig } from "@/lib/ai/server/config";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import type { OpenAIConnectionTestResult } from "@/lib/integrations/center/types";
import { canManageOrganizationSettings } from "@/lib/team/guards";

/** Test OpenAI connectivity using the existing provider health check. */
export async function testOpenAIConnectionAction(): Promise<OpenAIConnectionTestResult> {
  const session = await requireSession();

  if (!canManageOrganizationSettings(session)) {
    return { ok: false, message: ACTION_DENIED_MESSAGE, latencyMs: null };
  }

  const config = getAIConfig();

  if (!config.openaiApiKey) {
    return {
      ok: false,
      message: "OPENAI_API_KEY is not configured.",
      latencyMs: null,
    };
  }

  const provider = createOpenAIProvider(config.openaiApiKey, config.openaiModel);
  const health = await provider.health();

  return {
    ok: health.ok,
    message: health.message,
    latencyMs: health.latencyMs ?? null,
  };
}
