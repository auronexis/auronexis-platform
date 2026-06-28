"use client";

import type { ReactNode } from "react";
import type { AIUsageSummary, ReportAIContext } from "@/lib/ai/types";
import { ReportAIProvider } from "@/components/reports/ai/report-ai-provider";
import { ReportAssistantPanel } from "@/components/reports/ai/report-assistant-panel";
import { ReportAIFloatingTrigger } from "@/components/reports/ai/report-ai-section-button";

type ReportEditableWithAIProps = {
  children: ReactNode;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
  context: ReportAIContext;
  usageSummary: AIUsageSummary;
};

/** Wraps editable report workspace with AI provider, panel, and floating trigger. */
export function ReportEditableWithAI({
  children,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
  context,
  usageSummary,
}: ReportEditableWithAIProps) {
  return (
    <ReportAIProvider
      baseContext={context}
      aiEnabled={aiEnabled}
      initialUsageSummary={usageSummary}
    >
      {children}
      <ReportAIFloatingTrigger />
      <ReportAssistantPanel
        upgradeMessage={upgradeMessage}
        requiredPlanLabel={requiredPlanLabel}
      />
    </ReportAIProvider>
  );
}
