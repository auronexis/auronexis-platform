import "server-only";

import { loadWorkspaceCopilotContext, serializeWorkspaceContext } from "@/lib/ai/copilot/context/workspace-context";
import type { SessionContext } from "@/lib/tenancy/context";

/** Executive brief context — deterministic metrics only. */
export async function loadExecutiveBriefContext(session: SessionContext): Promise<string> {
  const context = await loadWorkspaceCopilotContext(session);

  const payload = {
    deterministicBrief: context.executiveBrief,
    topPriorities: context.topPriorities,
    portfolioInsights: context.insights,
    revenueAtRiskNote:
      "Revenue at risk is a calculated signal from priority scores — do not invent or change this value.",
  };

  return serializeWorkspaceContext({
    ...context,
    executiveBrief: context.executiveBrief,
  }).slice(0, 24_000) + "\n" + JSON.stringify(payload);
}
