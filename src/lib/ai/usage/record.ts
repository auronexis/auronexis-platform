import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AIProviderId } from "@/lib/ai/types";

export type RecordAIUsageInput = {
  organizationId: string;
  userId: string;
  feature?: string;
  provider: AIProviderId | string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
};

/** Insert AI usage via service role — server actions only. */
export async function recordAIUsageEvent(input: RecordAIUsageInput): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("ai_usage_events").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    feature: input.feature ?? "ai_report_assistant",
    provider: input.provider,
    model: input.model,
    input_tokens: input.inputTokens ?? null,
    output_tokens: input.outputTokens ?? null,
    total_tokens: input.totalTokens ?? null,
  } as never);

  if (error) {
    console.error("[AI] Failed to record usage event:", error.message);
  }
}
