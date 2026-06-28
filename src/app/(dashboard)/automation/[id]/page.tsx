import type { Metadata } from "next";
import Link from "next/link";
import { AutomationClientShell } from "@/components/automation/automation-client-shell";
import { AutomationDetailClient } from "@/components/automation/automation-detail-client";
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

type AutomationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: AutomationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Automation ${id.slice(0, 8)}` };
}

export default async function AutomationDetailPage({ params }: AutomationDetailPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");
  const planKey = await getCurrentPlan(session.organization.id);
  const canManage = canAccessModule(session.role, "workflows", "update");
  const canRunManual = canAccessModule(session.role, "workflows", "manage");

  return (
    <>
      <PageHeader
        module="workflows"
        title="Automation detail"
        description="Review workflow graph, execution history, and version snapshots."
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
            <AutomationDetailClient workflowId={id} canManage={canManage} canRunManual={canRunManual} />
          </AutomationClientShell>
        )}
      </PageSurface>
    </>
  );
}
