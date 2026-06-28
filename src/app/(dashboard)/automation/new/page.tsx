import type { Metadata } from "next";
import Link from "next/link";
import {
  AutomationBuilderWorkspace,
  AutomationClientShell,
} from "@/components/automation/automation-client-shell";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canAccessModule } from "@/lib/rbac/permissions";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "New automation",
};

export default async function NewAutomationPage() {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");

  if (!canAccessModule(session.role, "workflows", "create")) {
    redirect("/automation");
  }

  const planKey = await getCurrentPlan(session.organization.id);

  return (
    <>
      <PageHeader
        module="workflows"
        title="Create automation"
        description="Use AI to translate natural language or build visually step by step."
        action={
          <Link href="/automation" className="text-sm font-medium text-accent-blue hover:underline">
            Back to automation
          </Link>
        }
      />

      <PageSurface>
        {!aiAccess.allowed ? (
          <AutomationUpgradeCard
            message={getFeatureUpgradeMessage("ai_automation_builder")}
            requiredPlanLabel={getRequiredPlanLabel("ai_automation_builder")}
          />
        ) : (
          <AutomationClientShell organizationId={session.organization.id} planKey={planKey}>
            <AutomationBuilderWorkspace />
          </AutomationClientShell>
        )}
      </PageSurface>
    </>
  );
}
