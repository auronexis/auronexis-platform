import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ClientSuccessSection } from "@/components/clients/success/client-success-section";
import { PredictiveIntelligenceSection } from "@/components/predictive/predictive-client-section";
import { ClientKnowledgeSection } from "@/components/knowledge/client-knowledge-section";
import { ClientRowActions } from "@/components/clients/client-row-actions";
import { ClientHealthScore } from "@/components/clients/client-health-score";
import { ClientForm } from "@/components/clients/client-form";
import { ClientStatusBadge } from "@/components/clients/client-status-badge";
import { IncidentStatusBadge } from "@/components/incidents/incident-status-badge";
import {
  DetailActionSection,
  DetailEmpty,
  DetailKpiGrid,
  DetailKpiStat,
  DetailMetaSeparator,
  DetailMetaText,
  DetailMetadataItem,
  DetailMetadataRail,
  DetailPageHeader,
  DetailPageLayout,
  DetailSection,
  DetailViewAllLink,
} from "@/components/layout/detail-page";
import { ClientHealthBadge } from "@/components/profitability/client-health-badge";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import { CreatePortalUserForm } from "@/components/client-portal/create-portal-user-form";
import { PortalUserList } from "@/components/client-portal/portal-user-list";
import { ClientSlaPolicySection } from "@/components/settings/client-sla-policy-section";
import { ClickableRow } from "@/components/ui/clickable-row";
import {
  AuroraDataTable,
  AuroraTable,
  AuroraTableBody,
  AuroraTableCell,
  AuroraTableHead,
  AuroraTableHeaderCell,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth/session";
import { canManagePortalUsers } from "@/lib/client-portal/guards";
import { listPortalUsersForClient } from "@/lib/client-portal/queries";
import { getClientOverview } from "@/lib/client-overview/queries";
import { updateClientAction } from "@/lib/clients/actions";
import { getClientById, listOrgUsers } from "@/lib/clients";
import { formatClientDate } from "@/lib/clients/types";
import { formatIncidentDate } from "@/lib/incidents/types";
import { formatMargin, formatCurrency } from "@/lib/profitability/types";
import { formatReportDate, formatReportPeriod } from "@/lib/reports/types";
import { formatRiskDate } from "@/lib/risks/types";
import { canAccessModule, canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { listSlaPolicies, getClientSlaAssignment } from "@/lib/sla/queries";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { linkText } from "@/lib/ui/tokens";
import type { IncidentSeverity, IncidentStatus, RiskSeverity, RiskStatus } from "@/types/database";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ClientDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const client = await getClientById(session, id);

  return {
    title: client?.name ?? "Client",
  };
}

function RestrictedValue() {
  return <span className="text-sm font-medium text-muted">Hidden for your role</span>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  await requireModuleAccess("clients");
  const session = await requireSession();
  const { id } = await params;
  const canManagePortal = canManagePortalUsers(session);
  const canManageSla = canManageOrganizationSettings(session);
  const canEdit = canAccessModule(session.role, "clients", "update");

  const [client, overview, portalUsers, slaPolicies, orgUsers] = await Promise.all([
    getClientById(session, id),
    getClientOverview(session, id),
    canManagePortal ? listPortalUsersForClient(session, id) : Promise.resolve([]),
    listSlaPolicies(session),
    canEdit ? listOrgUsers(session) : Promise.resolve([]),
  ]);

  if (!client) {
    notFound();
  }

  const slaAssignment = await getClientSlaAssignment(
    session.organization.id,
    client.sla_policy_id,
  );

  const showRevenue = canViewRevenue(session.role);
  const canManage =
    canAccessModule(session.role, "clients", "update") ||
    canAccessModule(session.role, "clients", "delete");
  const boundUpdateAction = updateClientAction.bind(null, client.id);
  const profitability = overview.kpis.profitability;
  const ownerName =
    orgUsers.find((user) => user.id === client.owner_id)?.full_name ?? "—";

  const metadataRail = (
    <DetailMetadataRail title="Client overview">
      <DetailMetadataItem label="Status">
        <ClientStatusBadge status={client.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Contact">{client.contact_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Email">{client.contact_email ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Owner">{ownerName}</DetailMetadataItem>
      <DetailMetadataItem label="Health score">
        <ClientHealthScore score={client.health_score} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Computed health">
        <ClientHealthBadge health={profitability?.health ?? "watch"} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Open risks">{overview.kpis.openRisksCount}</DetailMetadataItem>
      <DetailMetadataItem label="Open incidents">{overview.kpis.openIncidentsCount}</DetailMetadataItem>
      <DetailMetadataItem label="Created">{formatClientDate(client.created_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatClientDate(client.updated_at)}</DetailMetadataItem>
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="clients"
        title={client.name}
        description="Client workspace — operational context, health, and delivery."
        backHref="/clients"
        backLabel="Back to clients"
        meta={
          <>
            <ClientStatusBadge status={client.status} />
            <DetailMetaSeparator />
            <DetailMetaText>Updated {formatClientDate(client.updated_at)}</DetailMetaText>
          </>
        }
      />

      <DetailKpiGrid>
        <DetailKpiStat label="Client health">
          <ClientHealthBadge health={profitability?.health ?? "watch"} />
        </DetailKpiStat>
        <DetailKpiStat label="Monthly revenue">
          {showRevenue ? (
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(profitability?.monthlyRevenue ?? 0)}
            </span>
          ) : (
            <RestrictedValue />
          )}
        </DetailKpiStat>
        <DetailKpiStat label="Margin">
          {showRevenue ? (
            <span className="text-2xl font-semibold tracking-tight text-foreground">
              {formatMargin(profitability?.margin ?? null)}
            </span>
          ) : (
            <RestrictedValue />
          )}
        </DetailKpiStat>
        <DetailKpiStat label="Open risks">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {overview.kpis.openRisksCount}
          </span>
        </DetailKpiStat>
        <DetailKpiStat label="Open incidents">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {overview.kpis.openIncidentsCount}
          </span>
        </DetailKpiStat>
      </DetailKpiGrid>

      <DetailPageLayout rail={metadataRail}>
        <DetailSection title="Client summary" description="Core profile and contact details.">
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailMetadataItem label="Client name">{client.name}</DetailMetadataItem>
            <DetailMetadataItem label="Status">
              <ClientStatusBadge status={client.status} />
            </DetailMetadataItem>
            <DetailMetadataItem label="Contact person">{client.contact_name ?? "—"}</DetailMetadataItem>
            <DetailMetadataItem label="Contact email">{client.contact_email ?? "—"}</DetailMetadataItem>
            <DetailMetadataItem label="Owner">{ownerName}</DetailMetadataItem>
            <DetailMetadataItem label="Health score">
              <ClientHealthScore score={client.health_score} />
            </DetailMetadataItem>
          </dl>
        </DetailSection>

        <ClientSuccessSection clientId={client.id} />

        <PredictiveIntelligenceSection clientId={client.id} />

        <ClientKnowledgeSection clientId={client.id} clientName={client.name} />

        <DetailSection
          title="Latest report"
          description="Most recent report activity for this client."
        >
          {overview.latestReport ? (
            <div className="space-y-3">
              <p className="font-semibold text-foreground">{overview.latestReport.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <ReportStatusBadge status={overview.latestReport.status} />
                <DetailMetaText>
                  {formatReportPeriod(
                    overview.latestReport.reporting_period_start,
                    overview.latestReport.reporting_period_end,
                  )}
                </DetailMetaText>
              </div>
              <DetailMetaText>
                Updated {formatReportDate(overview.latestReport.updated_at)}
              </DetailMetaText>
              <Link href={`/reports/${overview.latestReport.id}`} className={linkText}>
                Open report
              </Link>
            </div>
          ) : (
            <DetailEmpty message="No published reports yet." />
          )}
        </DetailSection>

        <DetailSection
          title="Open risks"
          action={
            overview.openRisksTotal > 5 ? (
              <DetailViewAllLink href="/risks">View all risks</DetailViewAllLink>
            ) : undefined
          }
        >
          {overview.openRisks.length === 0 ? (
            <DetailEmpty message="No open risks for this client." />
          ) : (
            <AuroraDataTable>
              <AuroraTable>
                <AuroraTableHead>
                  <tr>
                    <AuroraTableHeaderCell>Risk</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Severity</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Due date</AuroraTableHeaderCell>
                  </tr>
                </AuroraTableHead>
                <AuroraTableBody>
                  {overview.openRisks.map((risk) => (
                    <ClickableRow
                      key={risk.id}
                      href={`/risks/${risk.id}`}
                      ariaLabel={`Open risk ${risk.title}`}
                    >
                      <AuroraTableCell>
                        <span className="font-semibold text-foreground">{risk.title}</span>
                      </AuroraTableCell>
                      <AuroraTableCell>
                        <RiskSeverityBadge severity={risk.severity as RiskSeverity} />
                      </AuroraTableCell>
                      <AuroraTableCell>
                        <RiskStatusBadge status={risk.status as RiskStatus} />
                      </AuroraTableCell>
                      <AuroraTableCell className="text-muted">
                        {risk.due_date ? formatRiskDate(risk.due_date) : "—"}
                      </AuroraTableCell>
                    </ClickableRow>
                  ))}
                </AuroraTableBody>
              </AuroraTable>
            </AuroraDataTable>
          )}
        </DetailSection>

        <DetailSection
          title="Open incidents"
          action={
            overview.openIncidentsTotal > 5 ? (
              <DetailViewAllLink href="/incidents">View all incidents</DetailViewAllLink>
            ) : undefined
          }
        >
          {overview.openIncidents.length === 0 ? (
            <DetailEmpty message="No related incidents for this client." />
          ) : (
            <AuroraDataTable>
              <AuroraTable>
                <AuroraTableHead>
                  <tr>
                    <AuroraTableHeaderCell>Incident</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Severity</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Status</AuroraTableHeaderCell>
                    <AuroraTableHeaderCell>Due date</AuroraTableHeaderCell>
                  </tr>
                </AuroraTableHead>
                <AuroraTableBody>
                  {overview.openIncidents.map((incident) => (
                    <ClickableRow
                      key={incident.id}
                      href={`/incidents/${incident.id}`}
                      ariaLabel={`Open incident ${incident.title}`}
                    >
                      <AuroraTableCell>
                        <span className="font-semibold text-foreground">{incident.title}</span>
                      </AuroraTableCell>
                      <AuroraTableCell>
                        <RiskSeverityBadge severity={incident.severity as IncidentSeverity} />
                      </AuroraTableCell>
                      <AuroraTableCell>
                        <IncidentStatusBadge status={incident.status as IncidentStatus} />
                      </AuroraTableCell>
                      <AuroraTableCell className="text-muted">
                        {incident.due_at ? formatIncidentDate(incident.due_at) : "—"}
                      </AuroraTableCell>
                    </ClickableRow>
                  ))}
                </AuroraTableBody>
              </AuroraTable>
            </AuroraDataTable>
          )}
        </DetailSection>

        <DetailSection
          title="SLA policy"
          description="Response-time targets applied to this client's open incidents and risks."
        >
          <ClientSlaPolicySection
            clientId={client.id}
            assignment={slaAssignment}
            policies={slaPolicies}
            readOnly={!canManageSla}
          />
        </DetailSection>

        {canManagePortal ? (
          <>
            <DetailSection
              title="Client portal access"
              description="Login credentials for client-facing report and status views."
            >
              {portalUsers.length === 0 ? (
                <DetailEmpty message="No portal users configured for this client." />
              ) : (
                <PortalUserList users={portalUsers} />
              )}
            </DetailSection>

            <DetailSection title="Create portal user">
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                Portal login URL:{" "}
                <span className="font-medium text-blue-600 dark:text-blue-300">/client-portal/login</span>
              </p>
              <CreatePortalUserForm clientId={client.id} />
            </DetailSection>
          </>
        ) : null}

        <DetailSection
          title="Recent activity"
          action={<DetailViewAllLink href="/activity">View full activity</DetailViewAllLink>}
        >
          <ActivityTimeline
            events={overview.recentActivity}
            emptyMessage="No recent activity for this client."
            emptyDescription="Operational changes will appear here as your team works on this client."
          />
        </DetailSection>

        {canEdit ? (
          <>
            <DetailSection
              title="Edit client"
              description="Update client profile and operational notes."
            >
              <ClientForm
                action={boundUpdateAction}
                client={client}
                orgUsers={orgUsers}
                showRevenue={showRevenue}
                submitLabel="Save changes"
                pendingLabel="Saving…"
              />
            </DetailSection>

            {canManage ? (
              <DetailActionSection
                title="Client actions"
                description="Archive to hide from active lists, or permanently delete the client record."
                variant="danger"
              >
                <ClientRowActions
                  clientId={client.id}
                  clientName={client.name}
                  canManage={canManage}
                  isArchived={client.status === "archived"}
                  variant="detail"
                />
              </DetailActionSection>
            ) : null}
          </>
        ) : (
          <DetailSection title="Notes">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {client.notes ?? "—"}
            </p>
          </DetailSection>
        )}
      </DetailPageLayout>
    </>
  );
}
