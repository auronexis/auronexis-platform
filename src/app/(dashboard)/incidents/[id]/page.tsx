import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveIncidentButton } from "@/components/incidents/archive-incident-button";
import { IncidentForm } from "@/components/incidents/incident-form";
import { ResolveIncidentForm } from "@/components/incidents/resolve-incident-form";
import { IncidentBadge } from "@/components/incidents/incident-badge";
import { IncidentActivityFeed } from "@/components/incidents/incident-activity-feed";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
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
import { updateIncidentAction } from "@/lib/incidents/actions";
import { canEditIncident, canManageIncidentLifecycle } from "@/lib/incidents/guards";
import {
  getIncidentById,
  listIncidentActivity,
  listLinkableRisks,
} from "@/lib/incidents/queries";
import {
  formatIncidentDate,
  formatIncidentDateTime,
  INCIDENT_STATUSES,
  STAFF_INCIDENT_STATUSES,
} from "@/lib/incidents/types";
import { listOrgUsers } from "@/lib/risks/queries";
import { getIncidentSlaInfo } from "@/lib/sla/queries";
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

type IncidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: IncidentDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const incident = await getIncidentById(session, id);

  return {
    title: incident?.title ?? "Incident",
  };
}

export default async function IncidentDetailPage({ params }: IncidentDetailPageProps) {
  await requireModuleAccess("incidents");
  const session = await requireSession();
  const { id } = await params;
  const incident = await getIncidentById(session, id);

  if (!incident) {
    notFound();
  }

  const [sla, activity] = await Promise.all([
    getIncidentSlaInfo(session, {
      client_id: incident.client_id,
      created_at: incident.created_at,
      status: incident.status,
      resolved_at: incident.resolved_at,
    }),
    listIncidentActivity(session, incident.id),
  ]);
  const editable = canEditIncident(session, incident);
  const canManageLifecycle = canManageIncidentLifecycle(session);
  const canArchive = canManageLifecycle && incident.status !== "archived";
  const canResolve =
    canManageLifecycle &&
    (incident.status === "open" || incident.status === "investigating");
  const boundUpdateAction = updateIncidentAction.bind(null, incident.id);
  const clients = editable ? await listClients(session) : [];
  const risks = editable ? await listLinkableRisks(session) : [];
  const orgUsers =
    editable && (session.role === "owner" || session.role === "admin")
      ? await listOrgUsers(session)
      : [];
  const allowedStatuses =
    session.role === "staff" ? STAFF_INCIDENT_STATUSES : INCIDENT_STATUSES;

  const [aiAccess, planKey] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_incident_assistant"),
    getCurrentPlan(session.organization.id),
  ]);
  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const aiEnabled = aiAccess.allowed && editable;
  const aiUpgradeMessage = getFeatureUpgradeMessage("ai_incident_assistant");
  const aiRequiredPlanLabel = getRequiredPlanLabel("ai_incident_assistant");

  const metadataRail = (
    <DetailMetadataRail title="Incident overview">
      <DetailMetadataItem label="Severity">
        <IncidentBadge kind="severity" value={incident.severity} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Status">
        <IncidentBadge kind="status" value={incident.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Client">
        {incident.clients?.name ? (
          <Link href={`/clients/${incident.client_id}`} className={linkText}>
            {incident.clients.name}
          </Link>
        ) : (
          "—"
        )}
      </DetailMetadataItem>
      <DetailMetadataItem label="Assigned to">{incident.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Linked risk">
        {incident.risk_id && incident.risks?.title ? (
          <Link href={`/risks/${incident.risk_id}`} className={linkText}>
            {incident.risks.title}
          </Link>
        ) : (
          "—"
        )}
      </DetailMetadataItem>
      <DetailMetadataItem label="Occurred">
        {formatIncidentDateTime(incident.occurred_at)}
      </DetailMetadataItem>
      <DetailMetadataItem label="Due">{formatIncidentDateTime(incident.due_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Created">{formatIncidentDate(incident.created_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatIncidentDate(incident.updated_at)}</DetailMetadataItem>
      <DetailMetadataItem label="SLA">
        <SlaDetailSection sla={sla} compact showPolicy={false} />
      </DetailMetadataItem>
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="incidents"
        title={incident.title}
        description="Incident command — investigation and resolution tracking."
        backHref="/incidents"
        backLabel="Back to incidents"
        meta={
          <>
            <IncidentBadge kind="severity" value={incident.severity} />
            <IncidentBadge kind="status" value={incident.status} />
            <DetailMetaSeparator />
            <DetailMetaText>Updated {formatIncidentDate(incident.updated_at)}</DetailMetaText>
          </>
        }
      />

      <DetailPageLayout rail={metadataRail}>
        {!editable ? (
          <DetailSection title="Incident summary" description="Investigation context and notes.">
            <dl className="grid gap-6">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Description
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {incident.description ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  Resolution notes
                </dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {incident.resolution_notes ?? "—"}
                </dd>
              </div>
              {incident.resolved_at ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    Resolved at
                  </dt>
                  <dd className="mt-2 text-sm text-foreground">
                    {formatIncidentDateTime(incident.resolved_at)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </DetailSection>
        ) : null}

        <SlaDetailSection sla={sla} />

        <DetailSection
          title="Incident timeline"
          description="Chronological audit trail for this incident."
        >
          <IncidentTimeline events={activity} />
        </DetailSection>

        <DetailSection
          title="Activity feed"
          description="Recent incident events across your workspace."
        >
          <IncidentActivityFeed events={activity} />
        </DetailSection>

        {editable ? (
          <DetailSection
            title="Edit incident"
            description="Update investigation details, assignment, and linked risk."
          >
            <OperationalEditableWithAI
              entityType="incident"
              entityId={incident.id}
              aiEnabled={aiEnabled}
              upgradeMessage={aiUpgradeMessage}
              requiredPlanLabel={aiRequiredPlanLabel}
              usageSummary={aiUsageSummary}
              initialMeta={{
                clientId: incident.client_id,
                title: incident.title,
                severity: incident.severity,
                status: incident.status,
                assigneeUserId: incident.assigned_user_id,
                dueDate: incident.due_at,
                linkedRiskId: incident.risk_id,
              }}
              initialFieldValues={{
                description: incident.description ?? "",
                resolution_notes: incident.resolution_notes ?? "",
              }}
            >
              <IncidentForm
                action={boundUpdateAction}
                incident={incident}
                clients={clients}
                risks={risks}
                orgUsers={orgUsers}
                showAssigneeSelect={session.role === "owner" || session.role === "admin"}
                allowedStatuses={allowedStatuses}
                defaultAssignedUserId={session.user.id}
                submitLabel="Save changes"
                pendingLabel="Saving…"
                aiEnabled={aiEnabled}
              />
            </OperationalEditableWithAI>
          </DetailSection>
        ) : null}

        {canResolve ? (
          <DetailActionSection
            title="Resolve incident"
            description="Close this incident once remediation is complete."
          >
            <ResolveIncidentForm incidentId={incident.id} />
          </DetailActionSection>
        ) : null}

        {canArchive ? (
          <DetailActionSection
            title="Archive incident"
            description="Archived incidents are removed from the active list but remain in the system."
            variant="danger"
          >
            <ArchiveIncidentButton incidentId={incident.id} incidentTitle={incident.title} />
          </DetailActionSection>
        ) : null}

        <RelatedKnowledgeSection
          clientId={incident.client_id}
          title={incident.title}
          text={`${incident.description ?? ""} ${incident.resolution_notes ?? ""}`}
          entityType="incident"
          entityId={incident.id}
        />
      </DetailPageLayout>
    </>
  );
}
