import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportForm } from "@/components/reports/report-form";
import { ReportEditableWithAI } from "@/components/reports/ai/report-editable-with-ai";
import { PageHeader, ModulePlaceholder } from "@/components/layout/page-header";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { LinkButton } from "@/components/ui/link-button";
import { listClients } from "@/lib/clients/queries";
import { createReportAction } from "@/lib/reports/actions";
import { canCreateReport } from "@/lib/reports/guards";
import { STAFF_REPORT_STATUSES } from "@/lib/reports/types";
import { listReportTemplates } from "@/lib/report-templates/queries";
import { listOrgUsers } from "@/lib/risks/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { linkText } from "@/lib/ui/tokens";
import { buildReportAIContextFromForm } from "@/lib/ai/prompts";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";

export const metadata: Metadata = {
  title: "Create report",
};

export default async function NewReportPage() {
  await requireModuleAccess("reports");
  const session = await requireSession();

  if (!canCreateReport(session)) {
    redirect("/reports");
  }

  const clients = await listClients(session);
  const templates = await listReportTemplates(session);
  const orgUsers =
    session.role === "owner" || session.role === "admin"
      ? await listOrgUsers(session)
      : [];
  const showAssigneeSelect = session.role === "owner" || session.role === "admin";
  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_report_assistant"),
    getCurrentPlan(session.organization.id),
  ]);
  const aiEnabled = aiAccess.allowed;
  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const defaultClient = clients[0];
  const aiContext = buildReportAIContextFromForm({
    reportTitle: "",
    clientId: defaultClient?.id ?? "",
    clientName: defaultClient?.name ?? "",
    organizationName: session.organization.name,
    reportingPeriodStart: "",
    reportingPeriodEnd: "",
    periodLabel: "Not set",
    templateName: templates.find((template) => template.is_default)?.name ?? null,
  });

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Create report"
          description="Build an executive report linked to a client."
          action={
            <Link href="/reports" className={linkText}>
              Back to reports
            </Link>
          }
        />
        <ModulePlaceholder
          title="Add a client first"
          description="Reports must be linked to an existing client record."
        />
        <div className="mt-4">
          <LinkButton href="/clients/new" variant="secondary">
            Create a client
          </LinkButton>
        </div>
      </>
    );
  }

  return (
    <DashboardPage>
      <PageHeader
        module="reports"
        title="Create report"
        description="Build an executive report linked to a client."
        action={
          <Link href="/reports" className={linkText}>
            Back to reports
          </Link>
        }
      />

      <ReportEditableWithAI
        layout="split"
        aiEnabled={aiEnabled}
        upgradeMessage={getFeatureUpgradeMessage("ai_report_assistant")}
        requiredPlanLabel={getRequiredPlanLabel("ai_report_assistant")}
        context={aiContext}
        usageSummary={aiUsageSummary}
      >
        <ReportForm
          action={createReportAction}
          clients={clients}
          orgUsers={orgUsers}
          showAssigneeSelect={showAssigneeSelect}
          allowedStatuses={STAFF_REPORT_STATUSES}
          defaultAssignedUserId={session.user.id}
          templates={templates}
          submitLabel="Create report"
          pendingLabel="Creating…"
          aiEnabled={aiEnabled}
        />
      </ReportEditableWithAI>
    </DashboardPage>
  );
}
