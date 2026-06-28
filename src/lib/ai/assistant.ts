import { buildReportAIPrompt } from "@/lib/ai/prompts";
import { getDefaultAIProvider } from "@/lib/ai/providers";
import type {
  AIHistoryEntry,
  ReportAIActionKey,
  ReportAISectionKey,
  ReportAssistantRunInput,
  ReportAssistantRunResult,
} from "@/lib/ai/types";

function createHistoryEntry(
  action: ReportAIActionKey,
  section: ReportAISectionKey | undefined,
  response: string,
): AIHistoryEntry {
  return {
    id: crypto.randomUUID(),
    action,
    section,
    response,
    timestamp: new Date().toISOString(),
    isPlaceholder: true,
  };
}

/** @deprecated Use server actions. Legacy client-side placeholder path. */
export async function runReportAssistantAction(
  input: ReportAssistantRunInput,
): Promise<ReportAssistantRunResult> {
  const provider = getDefaultAIProvider();
  const prompt = buildReportAIPrompt(
    input.action,
    input.context,
    input.section,
    input.fieldValues,
  );

  const response = await provider.generate({
    prompt,
    action: input.action,
    section: input.section,
    context: input.context,
  });

  const historyEntry = createHistoryEntry(input.action, input.section, response.content);

  return { response, prompt, historyEntry };
}

export { checkAIProviderHealth } from "@/lib/ai/core/observability";
