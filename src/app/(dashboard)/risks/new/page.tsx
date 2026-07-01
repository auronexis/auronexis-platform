import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RiskForm } from "@/components/risks/risk-form";
import { PageHeader } from "@/components/layout/page-header";
import { listClients } from "@/lib/clients/queries";
import { createRiskAction } from "@/lib/risks/actions";
import { canCreateRisk } from "@/lib/risks/guards";
import { listOrgUsers } from "@/lib/risks/queries";
import { OperationalEditableWithAI } from "@/components/operational/ai/operational-editable-with-ai";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Add risk",
};

type NewRiskPageProps = {
  searchParams: Promise<{ clientId?: string }>;
};

export default async function NewRiskPage({ searchParams }: NewRiskPageProps) {
  await requireModuleAccess("risks");
  const session = await requireSession();
  const params = await searchParams;

  if (!canCreateRisk(session)) {
    redirect("/risks");
  }

  const clients = await listClients(session);
  const orgUsers =
    session.role === "owner" || session.role === "admin"
      ? await listOrgUsers(session)
      : [];
  const showOwnerSelect = session.role === "owner" || session.role === "admin";
  const defaultClientId =
    params.clientId && clients.some((c) => c.id === params.clientId)
      ? params.clientId
      : (clients[0]?.id ?? "");
  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_risk_assistant"),
    getCurrentPlan(session.organization.id),
  ]);
  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const aiEnabled = aiAccess.allowed;
  const aiUpgradeMessage = getFeatureUpgradeMessage("ai_risk_assistant");
  const aiRequiredPlanLabel = getRequiredPlanLabel("ai_risk_assistant");

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Add risk"
          description="Create a new operational risk linked to a client."
          action={
            <Link href="/risks" className="text-sm font-medium text-accent-blue hover:underline">
              Back to risks
            </Link>
          }
        />
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-12 text-center">
          <p className="text-lg font-medium text-foreground">Add a client first</p>
          <p className="mt-2 text-sm text-muted">
            Risks must be linked to an existing client record.
          </p>
          <Link href="/clients/new" className="mt-4 inline-block text-sm font-medium text-accent-blue hover:underline">
            Create a client
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add risk"
        description="Create a new operational risk linked to a client."
        action={
          <Link href="/risks" className="text-sm font-medium text-accent-blue hover:underline">
            Back to risks
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <OperationalEditableWithAI
          entityType="risk"
          aiEnabled={aiEnabled}
          upgradeMessage={aiUpgradeMessage}
          requiredPlanLabel={aiRequiredPlanLabel}
          usageSummary={aiUsageSummary}
          initialMeta={{
            clientId: defaultClientId,
            title: "",
            severity: "medium",
            status: "open",
            assigneeUserId: session.user.id,
            dueDate: null,
            linkedRiskId: null,
          }}
          initialFieldValues={{
            description: "",
            resolution_notes: "",
          }}
        >
          <RiskForm
            action={createRiskAction}
            clients={clients}
            orgUsers={orgUsers}
            showOwnerSelect={showOwnerSelect}
            allowedStatuses={["open"]}
            defaultOwnerUserId={session.user.id}
            submitLabel="Create risk"
            pendingLabel="Creating…"
            aiEnabled={aiEnabled}
          />
        </OperationalEditableWithAI>
      </div>
    </>
  );
}
