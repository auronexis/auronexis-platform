"use client";

import { CopilotWorkspace } from "@/components/copilot/copilot-workspace";
import { CLIENT_SUGGESTED_PROMPTS } from "@/lib/ai/copilot/suggested-prompts";
import type { AIUsageSummary } from "@/lib/ai/types";

type ClientCopilotPanelProps = {
  clientId: string;
  clientName: string;
  allowed: boolean;
  upgradeMessage: string;
  requiredPlanLabel: string;
  providerConfigured: boolean;
  usageSummary: AIUsageSummary;
};

export function ClientCopilotPanel({
  clientId,
  clientName,
  allowed,
  upgradeMessage,
  requiredPlanLabel,
  providerConfigured,
  usageSummary,
}: ClientCopilotPanelProps) {
  return (
    <CopilotWorkspace
      allowed={allowed}
      upgradeMessage={upgradeMessage}
      requiredPlanLabel={requiredPlanLabel}
      providerConfigured={providerConfigured}
      initialUsage={usageSummary}
      suggestedPrompts={CLIENT_SUGGESTED_PROMPTS}
      initialTaskType="client_summary"
      clientId={clientId}
      title={`Ask Auroranexis · ${clientName}`}
      description="Client-specific summary, health, risks, incidents, reports, and recommended next actions."
    />
  );
}
