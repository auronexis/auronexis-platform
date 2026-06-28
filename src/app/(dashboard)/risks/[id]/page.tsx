import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveRiskButton } from "@/components/risks/archive-risk-button";
import { ResolveRiskForm } from "@/components/risks/resolve-risk-form";
import { RiskForm } from "@/components/risks/risk-form";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import { SlaDetailSection } from "@/components/sla/sla-detail-section";
import {
  DetailActionSection,
  DetailMetaSeparator,
  DetailMetaText,
  DetailMetadataItem,
  DetailMetadataRail,
  DetailPageHeader,
  DetailPageLayout,
  DetailSection,
} from "@/components/layout/detail-page";
import { listClients } from "@/lib/clients/queries";
import { updateRiskAction } from "@/lib/risks/actions";
import { canEditRisk, canManageRiskLifecycle } from "@/lib/risks/guards";
import { getRiskById, listOrgUsers } from "@/lib/risks/queries";
import { getRiskSlaInfo } from "@/lib/sla/queries";
import {
  formatRiskDate,
  RISK_STATUSES,
  STAFF_RISK_STATUSES,
} from "@/lib/risks/types";
import { OperationalEditableWithAI } from "@/components/operational/ai/operational-editable-with-ai";
import { RelatedKnowledgeSection } from "@/components/knowledge/related-knowledge-section";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { linkText } from "@/lib/ui/tokens";

type RiskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RiskDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const risk = await getRiskById(session, id);

  return {
    title: risk?.title ?? "Risk",
  };
}

export default async function RiskDetailPage({ params }: RiskDetailPageProps) {
  await requireModuleAccess("risks");
  const session = await requireSession();
  const { id } = await params;
  const risk = await getRiskById(session, id);

  if (!risk) {
    notFound();
  }

  const sla = await getRiskSlaInfo(session, {
    client_id: risk.client_id,
    created_at: risk.created_at,
    status: risk.status,
    resolved_at: risk.resolved_at,
  });
  const editable = canEditRisk(session, risk);
  const canManageLifecycle = canManageRiskLifecycle(session);
  const canArchive = canManageLifecycle && risk.status !== "archived";
  const canResolve =
    canManageLifecycle && (risk.status === "open" || risk.status === "in_progress");
  const boundUpdateAction = updateRiskAction.bind(null, risk.id);
  const clients = editable ? await listClients(session) : [];
  const orgUsers =
    editable && (session.role === "owner" || session.role === "admin")
      ? await listOrgUsers(session)
      : [];
  const allowedStatuses =
    session.role === "staff" ? STAFF_RISK_STATUSES : RISK_STATUSES;

  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_risk_assistant"),
    getCurrentPlan(session.organization.id),
  ]);
  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const aiEnabled = aiAccess.allowed && editable;
  const aiUpgradeMessage = getFeatureUpgradeMessage("ai_risk_assistant");
  const aiRequiredPlanLabel = getRequiredPlanLabel("ai_risk_assistant");

  const metadataRail = (
    <DetailMetadataRail title="Risk overview">
      <DetailMetadataItem label="Severity">
        <RiskSeverityBadge severity={risk.severity} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Status">
        <RiskStatusBadge status={risk.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Client">
        {risk.clients?.name ? (
          <Link href={`/clients/${risk.client_id}`} className={linkText}>
            {risk.clients.name}
          </Link>
        ) : (
          "—"
        )}
      </DetailMetadataItem>
      <DetailMetadataItem label="Owner">{risk.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Due date">{formatRiskDate(risk.due_date)}</DetailMetadataItem>
      <DetailMetadataItem label="Created">{formatRiskDate(risk.created_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatRiskDate(risk.updated_at)}</DetailMetadataItem>
      <DetailMetadataItem label="SLA">
        <SlaDetailSection sla={sla} compact showPolicy={false} />
      </DetailMetadataItem>
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="risks"
        title={risk.title}
        description="Operational risk details and mitigation tracking."
        backHref="/risks"
        backLabel="Back to risks"
        meta={
          <>
            <RiskSeverityBadge severity={risk.severity} />
            <RiskStatusBadge status={risk.status} />
            <DetailMetaSeparator />
            <DetailMetaText>Updated {formatRiskDate(risk.updated_at)}</DetailMetaText>
            {risk.due_date ? (
              <>
                <DetailMetaSeparator />
                <DetailMetaText>Due {formatRiskDate(risk.due_date)}</DetailMetaText>
              </>
            ) : null}
          </>
        }
      />

      <DetailPageLayout rail={metadataRail}>
        {!editable ? (
          <DetailSection title="Risk description" description="Impact assessment and context.">
            <dl className="grid gap-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Description
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {risk.description ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Resolution notes
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {risk.resolution_notes ?? "—"}
                </dd>
              </div>
            </dl>
          </DetailSection>
        ) : null}

        <SlaDetailSection sla={sla} />

        {editable ? (
          <DetailSection
            title="Edit risk"
            description="Update details, assignment, and mitigation progress."
          >
            <OperationalEditableWithAI
              entityType="risk"
              entityId={risk.id}
              aiEnabled={aiEnabled}
              upgradeMessage={aiUpgradeMessage}
              requiredPlanLabel={aiRequiredPlanLabel}
              usageSummary={aiUsageSummary}
              initialMeta={{
                clientId: risk.client_id,
                title: risk.title,
                severity: risk.severity,
                status: risk.status,
                assigneeUserId: risk.owner_user_id,
                dueDate: risk.due_date,
                linkedRiskId: null,
              }}
              initialFieldValues={{
                description: risk.description ?? "",
                resolution_notes: risk.resolution_notes ?? "",
              }}
            >
              <RiskForm
                action={boundUpdateAction}
                risk={risk}
                clients={clients}
                orgUsers={orgUsers}
                showOwnerSelect={session.role === "owner" || session.role === "admin"}
                allowedStatuses={allowedStatuses}
                defaultOwnerUserId={session.user.id}
                submitLabel="Save changes"
                pendingLabel="Saving…"
                aiEnabled={aiEnabled}
              />
            </OperationalEditableWithAI>
          </DetailSection>
        ) : null}

        {canResolve ? (
          <DetailActionSection
            title="Resolve risk"
            description="Close this risk once mitigation is complete."
          >
            <ResolveRiskForm riskId={risk.id} />
          </DetailActionSection>
        ) : null}

        {canArchive ? (
          <DetailActionSection
            title="Archive risk"
            description="Archived risks are removed from the active list but remain in the system."
            variant="danger"
          >
            <ArchiveRiskButton riskId={risk.id} riskTitle={risk.title} />
          </DetailActionSection>
        ) : null}

        <RelatedKnowledgeSection
          clientId={risk.client_id}
          title={risk.title}
          text={`${risk.description ?? ""} ${risk.resolution_notes ?? ""}`}
          entityType="risk"
          entityId={risk.id}
        />
      </DetailPageLayout>
    </>
  );
}
