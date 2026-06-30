import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IncidentForm } from "@/components/incidents/incident-form";
import { PageHeader } from "@/components/layout/page-header";
import { listClients } from "@/lib/clients/queries";
import { createIncidentAction } from "@/lib/incidents/actions";
import { canCreateIncident } from "@/lib/incidents/guards";
import { listLinkableRisks } from "@/lib/incidents/queries";
import { STAFF_INCIDENT_STATUSES } from "@/lib/incidents/types";
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
  title: "Add incident",
};

export default async function NewIncidentPage() {
  await requireModuleAccess("incidents");
  const session = await requireSession();

  if (!canCreateIncident(session)) {
    redirect("/incidents");
  }

  const clients = await listClients(session);
  const risks = await listLinkableRisks(session);
  const orgUsers =
    session.role === "owner" || session.role === "admin"
      ? await listOrgUsers(session)
      : [];
  const showAssigneeSelect = session.role === "owner" || session.role === "admin";
  const defaultClientId = clients[0]?.id ?? "";
  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_incident_assistant"),
    getCurrentPlan(session.organization.id),
  ]);
  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const aiEnabled = aiAccess.allowed;
  const aiUpgradeMessage = getFeatureUpgradeMessage("ai_incident_assistant");
  const aiRequiredPlanLabel = getRequiredPlanLabel("ai_incident_assistant");

  if (clients.length === 0) {
    return (
      <>
        <PageHeader
          title="Add incident"
          description="Create a new operational incident linked to a client."
          action={
            <Link href="/incidents" className="text-sm font-medium text-accent-blue hover:underline">
              Back to incidents
            </Link>
          }
        />
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-1 p-12 text-center">
          <p className="text-lg font-medium text-foreground">Add a client first</p>
          <p className="mt-2 text-sm text-muted">
            Incidents must be linked to an existing client record.
          </p>
          <Link
            href="/clients/new"
            className="mt-4 inline-block text-sm font-medium text-accent-blue hover:underline"
          >
            Create a client
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Add incident"
        description="Create a new operational incident linked to a client."
        action={
          <Link href="/incidents" className="text-sm font-medium text-accent-blue hover:underline">
            Back to incidents
          </Link>
        }
      />

      <div className="max-w-3xl rounded-2xl border border-border-subtle bg-surface-1 p-6 shadow-sm">
        <OperationalEditableWithAI
          entityType="incident"
          aiEnabled={aiEnabled}
          upgradeMessage={aiUpgradeMessage}
          requiredPlanLabel={aiRequiredPlanLabel}
          usageSummary={aiUsageSummary}
          initialMeta={{
            clientId: defaultClientId,
            title: "",
            severity: "medium",
            status: STAFF_INCIDENT_STATUSES[0] ?? "open",
            assigneeUserId: session.user.id,
            dueDate: null,
            linkedRiskId: null,
          }}
          initialFieldValues={{
            description: "",
            resolution_notes: "",
          }}
        >
          <IncidentForm
            action={createIncidentAction}
            clients={clients}
            risks={risks}
            orgUsers={orgUsers}
            showAssigneeSelect={showAssigneeSelect}
            allowedStatuses={STAFF_INCIDENT_STATUSES}
            defaultAssignedUserId={session.user.id}
            submitLabel="Create incident"
            pendingLabel="Creating…"
            aiEnabled={aiEnabled}
          />
        </OperationalEditableWithAI>
      </div>
    </>
  );
}
