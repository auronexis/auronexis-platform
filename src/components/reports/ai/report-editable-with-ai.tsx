import type { ReactNode } from "react";
import type { AIUsageSummary, ReportAIContext } from "@/lib/ai/types";
import {
  DashboardPageAside,
  DashboardPageGrid,
  DashboardPageMain,
} from "@/components/layout/dashboard-page";
import { PageSurface } from "@/components/ui/page-surface";
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
  /** split: form + inline copilot rail on desktop. overlay: slide-over panel (default). */
  layout?: "overlay" | "split";
};

/** Wraps editable report workspace with AI provider, panel, and floating trigger. */
export function ReportEditableWithAI({
  children,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
  context,
  usageSummary,
  layout = "overlay",
}: ReportEditableWithAIProps) {
  const panel = (
    <ReportAssistantPanel
      layoutMode={layout === "split" ? "split" : "overlay"}
      upgradeMessage={upgradeMessage}
      requiredPlanLabel={requiredPlanLabel}
    />
  );

  return (
    <ReportAIProvider
      baseContext={context}
      aiEnabled={aiEnabled}
      initialUsageSummary={usageSummary}
    >
      {layout === "split" ? (
        <DashboardPageGrid>
          <DashboardPageMain>
            <PageSurface className="min-w-0 overflow-hidden">{children}</PageSurface>
          </DashboardPageMain>
          <DashboardPageAside>{panel}</DashboardPageAside>
        </DashboardPageGrid>
      ) : (
        children
      )}
      <ReportAIFloatingTrigger className={layout === "split" ? "xl:hidden" : undefined} />
      {layout === "overlay" ? panel : null}
    </ReportAIProvider>
  );
}
