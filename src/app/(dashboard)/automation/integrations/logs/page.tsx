import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IntegrationDeliveryLogsTable } from "@/components/automation/integration-delivery-logs-workspace";
import { AutomationUpgradeCard } from "@/components/automation/automation-center-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getIntegrationDeliveryLogs } from "@/lib/integrations/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";

export const metadata: Metadata = {
  title: "Integration runtime logs",
};

export default async function IntegrationDeliveryLogsPage() {
  const session = await requireSession();
  const aiAccess = await checkPlanFeatureForSession(session, "ai_automation_builder");

  if (!canManageOrganizationSettings(session)) {
    redirect("/automation/integrations");
  }

  const logs = aiAccess.allowed
    ? await getIntegrationDeliveryLogs({
        organizationId: session.organization.id,
        limit: 200,
      })
    : [];

  return (
    <>
      <PageHeader
        module="workflows"
        title="Integration runtime logs"
        description="Delivery status, retries, latency, and response codes for live integration executions. Secret values are never logged."
        action={
          <Link href="/automation/integrations" className="text-sm font-medium text-accent-blue hover:underline">
            Back to integrations
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
          <IntegrationDeliveryLogsTable logs={logs} />
        )}
      </PageSurface>
    </>
  );
}
