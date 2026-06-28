import type {
  AIGenerateRequest,
  AIGenerateResponse,
  AIHealthStatus,
  AIImproveRequest,
  AIProviderId,
  AISummarizeRequest,
} from "@/lib/ai/types";

/**
 * Provider-agnostic AI interface.
 * Implementations: OpenAI, Anthropic, Gemini, Azure OpenAI, local LLMs.
 * No concrete provider in Sprint 1 — see placeholder provider.
 */
export interface AIProvider {
  readonly id: AIProviderId;
  readonly displayName: string;

  /** Single-shot text generation. */
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;

  /** Optional streaming — future providers implement AsyncIterable chunks. */
  stream?(request: AIGenerateRequest): AsyncIterable<string>;

  /** Condense text while preserving meaning. */
  summarize?(request: AISummarizeRequest): Promise<AIGenerateResponse>;

  /** Rewrite text with a natural-language instruction. */
  improve?(request: AIImproveRequest): Promise<AIGenerateResponse>;

  /** Provider connectivity check for settings / health dashboards. */
  health(): Promise<AIHealthStatus>;
}

export type AIProviderFactory = () => AIProvider;
