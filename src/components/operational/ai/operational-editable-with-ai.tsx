import type { ReactNode } from "react";
import type { OperationalEntityType, OperationalFieldKey } from "@/lib/ai/operational/types";
import type { AIUsageSummary } from "@/lib/ai/types";
import { OperationalAIProvider } from "@/components/operational/ai/operational-ai-provider";
import { OperationalAssistantPanel } from "@/components/operational/ai/operational-assistant-panel";
import { OperationalAIFloatingTrigger } from "@/components/operational/ai/operational-ai-floating-trigger";

type OperationalEditableWithAIProps = {
  children: ReactNode;
  entityType: OperationalEntityType;
  entityId?: string;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
  usageSummary: AIUsageSummary;
  initialMeta: {
    clientId: string;
    title: string;
    severity: string;
    status: string;
    assigneeUserId: string | null;
    dueDate: string | null;
    linkedRiskId: string | null;
  };
  initialFieldValues: {
    description: string;
    resolution_notes: string;
  };
};

export function OperationalEditableWithAI({
  children,
  entityType,
  entityId,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
  usageSummary,
  initialMeta,
  initialFieldValues,
}: OperationalEditableWithAIProps) {
  return (
    <OperationalAIProvider
      entityType={entityType}
      entityId={entityId}
      aiEnabled={aiEnabled}
      initialUsageSummary={usageSummary}
      initialMeta={initialMeta}
      initialFieldValues={initialFieldValues}
    >
      {children}
      <OperationalAIFloatingTrigger />
      <OperationalAssistantPanel
        upgradeMessage={upgradeMessage}
        requiredPlanLabel={requiredPlanLabel}
      />
    </OperationalAIProvider>
  );
}

export type { OperationalFieldKey };
