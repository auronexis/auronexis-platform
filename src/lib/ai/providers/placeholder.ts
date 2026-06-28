import {
  PLACEHOLDER_SIMULATION_DELAY_MS,
  REPORT_AI_ACTION_LABELS,
  REPORT_AI_SECTION_LABELS,
  type AIGenerateRequest,
  type AIGenerateResponse,
  type AIHealthStatus,
  type AIImproveRequest,
  type AISummarizeRequest,
} from "@/lib/ai/types";
import type { AIProvider } from "@/lib/ai/providers/types";

const PLACEHOLDER_BANNER =
  "[AI Placeholder — no provider connected. Simulated output for workflow testing only.]";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildPlaceholderBody(request: AIGenerateRequest): string {
  const sectionLabel = request.section
    ? REPORT_AI_SECTION_LABELS[request.section]
    : "Full report";

  return [
    PLACEHOLDER_BANNER,
    "",
    `Action: ${REPORT_AI_ACTION_LABELS[request.action]}`,
    `Section: ${sectionLabel}`,
    `Client: ${request.context.clientName}`,
    `Period: ${request.context.periodLabel}`,
    "",
    "Sample draft text would appear here once an AI provider is connected.",
    "Replace this placeholder with real model output in a future sprint.",
  ].join("\n");
}

function toResponse(request: AIGenerateRequest, content: string): AIGenerateResponse {
  return {
    content,
    providerId: "placeholder",
    model: "placeholder-v1",
    isPlaceholder: true,
    finishReason: "placeholder",
    usage: {
      promptTokens: Math.ceil(request.prompt.length / 4),
      completionTokens: Math.ceil(content.length / 4),
    },
  };
}

/** Simulated provider — 800ms delay, clearly labeled placeholder content. */
export class PlaceholderAIProvider implements AIProvider {
  readonly id = "placeholder" as const;
  readonly displayName = "Placeholder (dev)";

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    await delay(PLACEHOLDER_SIMULATION_DELAY_MS);
    return toResponse(request, buildPlaceholderBody(request));
  }

  async *stream(request: AIGenerateRequest): AsyncIterable<string> {
    const full = buildPlaceholderBody(request);
    const chunks = full.split("\n");

    for (const chunk of chunks) {
      await delay(120);
      yield `${chunk}\n`;
    }
  }

  async summarize(request: AISummarizeRequest): Promise<AIGenerateResponse> {
    await delay(PLACEHOLDER_SIMULATION_DELAY_MS);
    const content = [
      PLACEHOLDER_BANNER,
      "",
      "Summarized placeholder:",
      request.text.slice(0, 200) || "(empty input)",
    ].join("\n");

    return toResponse(
      {
        prompt: request.text,
        action: "shorten",
        context: request.context,
      },
      content,
    );
  }

  async improve(request: AIImproveRequest): Promise<AIGenerateResponse> {
    await delay(PLACEHOLDER_SIMULATION_DELAY_MS);
    const content = [
      PLACEHOLDER_BANNER,
      "",
      `Instruction: ${request.instruction}`,
      "",
      "Improved placeholder:",
      request.text || "(empty input)",
    ].join("\n");

    return toResponse(
      {
        prompt: request.text,
        action: "improve_writing",
        context: request.context,
      },
      content,
    );
  }

  async health(): Promise<AIHealthStatus> {
    return {
      ok: true,
      providerId: "placeholder",
      message: "Placeholder provider active — connect a real provider to enable AI.",
      latencyMs: 0,
    };
  }
}

export const placeholderAIProvider = new PlaceholderAIProvider();
