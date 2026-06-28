/** Shared session history constants and helpers. */

export const AI_HISTORY_MAX_ENTRIES = 20;
export const AI_UNDO_WINDOW_MS = 30_000;

export type AIHistoryEntryBase = {
  id: string;
  action: string;
  response: string;
  timestamp: string;
  provider?: string;
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs?: number;
  isPlaceholder?: boolean;
  label?: string;
  sublabel?: string;
};

export function createHistoryEntryId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function trimHistory<T>(entries: T[], max = AI_HISTORY_MAX_ENTRIES): T[] {
  return entries.slice(0, max);
}

export function formatHistoryMeta(entry: AIHistoryEntryBase): string {
  const parts = [
    new Date(entry.timestamp).toLocaleString(),
    entry.provider,
    entry.model,
    entry.durationMs != null ? `${entry.durationMs}ms` : null,
    entry.inputTokens != null || entry.outputTokens != null
      ? `${entry.inputTokens ?? 0}+${entry.outputTokens ?? 0} tokens`
      : null,
    entry.isPlaceholder ? "Placeholder" : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
