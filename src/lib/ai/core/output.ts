/** Shared AI output shape returned from server actions. */

export type AIOutputMeta = {
  providerId: string;
  model: string;
  isPlaceholder: boolean;
  durationMs: number;
  contextBuildMs?: number;
  validationMs?: number;
  providerLatencyMs?: number;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  devNotice?: string;
};

export type AIOutput = {
  content: string;
  meta: AIOutputMeta;
};

export function buildAIOutput(content: string, meta: Omit<AIOutputMeta, "durationMs"> & { durationMs?: number }): AIOutput {
  return {
    content,
    meta: {
      durationMs: meta.durationMs ?? 0,
      ...meta,
    },
  };
}

export function mergeDevNotices(...notices: Array<string | null | undefined>): string | undefined {
  const merged = notices.filter(Boolean).join(" ");
  return merged || undefined;
}
