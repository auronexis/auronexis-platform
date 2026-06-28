import type { ReportAIContext } from "@/lib/ai/types";
import { buildReportAIContextFromForm } from "@/lib/ai/prompts";

export { buildReportAIContextFromForm };

/** Helpers for assembling AI context from report workspace data. */
export type BuildReportAIContextParams = Parameters<typeof buildReportAIContextFromForm>[0];

export function mergeFieldValuesIntoContext(
  context: ReportAIContext,
  fieldValues: Partial<
    Pick<ReportAIContext, "executiveSummary" | "keyWins" | "keyRisks" | "nextActions">
  >,
): ReportAIContext {
  return {
    ...context,
    executiveSummary: fieldValues.executiveSummary ?? context.executiveSummary,
    keyWins: fieldValues.keyWins ?? context.keyWins,
    keyRisks: fieldValues.keyRisks ?? context.keyRisks,
    nextActions: fieldValues.nextActions ?? context.nextActions,
  };
}
