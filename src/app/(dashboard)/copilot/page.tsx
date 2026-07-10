import type { Metadata } from "next";
import { CopilotWorkspace } from "@/components/copilot/copilot-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getCopilotAccessForSession } from "@/lib/ai/copilot/action";
import { WORKSPACE_SUGGESTED_PROMPTS } from "@/lib/ai/copilot/suggested-prompts";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { requireSession } from "@/lib/auth/session";
import { getCurrentPlan } from "@/lib/plans/queries";

export const metadata: Metadata = {
  title: "Ask Auroranexis",
  description: "Tenant-safe operational intelligence copilot for your workspace.",
};

type CopilotPageProps = {
  searchParams: Promise<{ task?: string; prompt?: string }>;
};

export default async function CopilotPage({ searchParams }: CopilotPageProps) {
  const session = await requireSession();
  const access = await getCopilotAccessForSession();
  const planKey = await getCurrentPlan(session.organization.id);
  const usage = await getAIUsageSummaryForSession(session, planKey);
  const params = await searchParams;

  const initialTaskType =
    params.task === "executive_brief" ? ("executive_brief" as const) : ("workspace_question" as const);
  const initialPrompt = params.prompt ?? (params.task === "executive_brief" ? "Create an executive brief." : "");

  return (
    <>
      <PageHeader
        module="dashboard"
        title="Ask Auroranexis"
        description="Understand clients, risks, incidents, reports, SLA state, and executive priorities — grounded in verified workspace data."
      />

      <PageSurface>
        <CopilotWorkspace
          allowed={access.allowed}
          upgradeMessage={access.message}
          requiredPlanLabel={access.requiredPlanLabel}
          providerConfigured={access.providerConfigured}
          initialUsage={usage}
          suggestedPrompts={WORKSPACE_SUGGESTED_PROMPTS}
          initialTaskType={initialTaskType}
          initialPrompt={initialPrompt}
        />
      </PageSurface>
    </>
  );
}
