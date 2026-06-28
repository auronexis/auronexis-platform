import type { Metadata } from "next";
import Link from "next/link";
import {
  AutomationClientShell,
} from "@/components/automation/automation-client-shell";
import { AutomationDashboardWorkspace } from "@/components/automation/automation-dashboard-workspace";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getAutomationSuggestions } from "@/lib/automation/builder/queries";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canAccessModule } from "@/lib/rbac/permissions";

export const metadata: Metadata = {
  title: "Automation",
};

export default async function AutomationPage() {
  const session = await requireSession();
  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_automation_builder"),
    getCurrentPlan(session.organization.id),
  ]);
  const canManage = canAccessModule(session.role, "workflows", "update");
  const suggestions = aiAccess.allowed ? await getAutomationSuggestions(session) : [];

  return (
    <>
      <PageHeader
        module="workflows"
        title="Automation"
        description="Build intelligent workflows without code — visual builder or AI-assisted translation."
        action={
          canManage && aiAccess.allowed ? (
            <Link href="/automation/new" className="text-sm font-medium text-accent-blue hover:underline">
              Create automation
            </Link>
          ) : null
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
            <AutomationDashboardWorkspace suggestions={suggestions} canManage={canManage} />
          </AutomationClientShell>
        )}
      </PageSurface>
    </>
  );
}
