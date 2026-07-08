import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ClientSuccessSection } from "@/components/clients/success/client-success-section";
import { PredictiveIntelligenceSection } from "@/components/predictive/predictive-client-section";
import { ClientKnowledgeSection } from "@/components/knowledge/client-knowledge-section";
import { ClientHealthCard } from "@/components/health/client-health-card";
import { ClientHealthHistory } from "@/components/health/client-health-history";
import { ClientSecondaryNav } from "@/components/clients/client-secondary-nav";
import { ClientHealthScoreWithTooltip } from "@/components/clients/client-health-score-with-tooltip";
import { ClientRowActions } from "@/components/clients/client-row-actions";
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
import { GenerateReportButton } from "@/components/reports/generate-report-button";
import { ReportCard } from "@/components/reports/report-card";
import { ReportPublishDialog } from "@/components/reports/report-publish-dialog";
import { ReportVersionHistory } from "@/components/reports/report-version-history";
import { RiskCard } from "@/components/risks/risk-card";
import { RiskEmptyState } from "@/components/risks/risk-empty-state";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { CreatePortalUserForm } from "@/components/client-portal/create-portal-user-form";
import { PortalUserList } from "@/components/client-portal/portal-user-list";
import { ClientSlaSummaryCard } from "@/components/clients/client-sla-summary-card";
import { ClientMonitoringSummaryCard } from "@/components/clients/client-monitoring-summary-card";
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
import { AccessDenied } from "@/components/authorization/access-denied";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { requireSession } from "@/lib/auth/session";
import { canManagePortalUsers } from "@/lib/client-portal/guards";
import { listPortalUsersForClient } from "@/lib/client-portal/queries";
import { getClientOverview } from "@/lib/client-overview/queries";
import { updateClientAction } from "@/lib/clients/actions";
import { getClientById, listOrgUsers } from "@/lib/clients";
import { getClientHealthDetail } from "@/lib/health/record";
import { formatClientDate } from "@/lib/clients/types";
import { formatIncidentDate } from "@/lib/incidents/types";
import { formatMargin, formatCurrency } from "@/lib/profitability/types";
import { canCreateReport, canManageReportLifecycle, canPublishReport } from "@/lib/reports/guards";
import { canCreateRisk } from "@/lib/risks/guards";
import { getReportHistory, listReportsV2 } from "@/lib/reports-v2";
import { listClientRisks, getClientRiskScoreSummary, OPEN_RISK_STATUSES } from "@/lib/risks";
import { canViewRevenue } from "@/lib/rbac/permissions";
import { listSlaPolicies, getClientSlaAssignment } from "@/lib/sla/queries";
import { getClientSLA } from "@/lib/sla/summary";
import { getClientMonitoringSummary } from "@/lib/monitoring/summary";
import { canManageSlaPolicies } from "@/lib/team/guards";
import { linkText } from "@/lib/ui/tokens";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";

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
  const session = await requireSession();

  if (!sessionHasPermission(session, "clients.read")) {
    return (
      <DetailPageLayout>
        <DetailPageHeader
          module="clients"
          title="Client"
          backHref="/clients"
          backLabel="Back to clients"
        />
        <AccessDenied />
      </DetailPageLayout>
    );
  }

  const { id } = await params;
  const canManagePortal = canManagePortalUsers(session);
  const canManageSla = canManageSlaPolicies(session);
  const canEdit = sessionHasPermission(session, "clients.write");

  const [client, overview, portalUsers, slaPolicies, orgUsers, recentReportsResult, clientRisks, riskScoreSummary] =
    await Promise.all([
    getClientById(session, id).catch(() => null),
    getClientOverview(session, id),
    canManagePortal
      ? listPortalUsersForClient(session, id).catch(() => [] as Awaited<ReturnType<typeof listPortalUsersForClient>>)
      : Promise.resolve([]),
    listSlaPolicies(session).catch(() => [] as Awaited<ReturnType<typeof listSlaPolicies>>),
    canEdit ? listOrgUsers(session).catch(() => [] as Awaited<ReturnType<typeof listOrgUsers>>) : Promise.resolve([]),
    listReportsV2(session, { clientId: id, limit: 5 }),
    listClientRisks(session, id, { status: [...OPEN_RISK_STATUSES], limit: 5 }),
    getClientRiskScoreSummary(session, id),
  ]);

  if (!client) {
    notFound();
  }

  const healthDetail = await getClientHealthDetail(session, client).catch(() => ({
    latest: null,
    history: [],
  }));

  const slaAssignment = await getClientSlaAssignment(
    session.organization.id,
    client.sla_policy_id,
  );
  const clientSlaSummary = await getClientSLA(session, id);
  const clientMonitoringSummary = await getClientMonitoringSummary(session, id);

  const recentReports = recentReportsResult.data ?? [];
  const primaryReport = recentReports[0] ?? overview.latestReport ?? null;
  const reportHistoryResult = primaryReport
    ? await getReportHistory(session, primaryReport.id)
    : { data: [], error: null };
  const reportVersions = reportHistoryResult.data ?? [];
  const canCreateReports = canCreateReport(session);
  const canCreateClientRisk = canCreateRisk(session);
  const canGenerateReports = canManageReportLifecycle(session);
  const canPublishReports = canPublishReport(session);

  const showRevenue = canViewRevenue(session.role);
  const canManage = sessionHasPermission(session, "clients.write");
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
        <ClientHealthScoreWithTooltip score={client.health_score} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Computed health">
        <ClientHealthBadge health={profitability?.health ?? "watch"} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Open risks">{riskScoreSummary.openCount}</DetailMetadataItem>
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

      <DetailKpiGrid id="client-kpis">
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
          <Link href="/risks?tab=open" className="text-2xl font-semibold tracking-tight text-foreground hover:text-primary">
            {riskScoreSummary.openCount}
          </Link>
        </DetailKpiStat>
        <DetailKpiStat label="Avg risk score">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {riskScoreSummary.averageRiskScore ?? "—"}
          </span>
        </DetailKpiStat>
        <DetailKpiStat label="Highest score">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {riskScoreSummary.highestScore ?? "—"}
          </span>
        </DetailKpiStat>
        <DetailKpiStat label="Open incidents">
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            {overview.kpis.openIncidentsCount}
          </span>
        </DetailKpiStat>
      </DetailKpiGrid>

      <DetailPageLayout rail={metadataRail} secondaryNav={<ClientSecondaryNav />}>
        <DetailSection
          id="client-summary"
          title="Client summary"
          description="Core profile and contact details."
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailMetadataItem label="Client name">{client.name}</DetailMetadataItem>
            <DetailMetadataItem label="Status">
              <ClientStatusBadge status={client.status} />
            </DetailMetadataItem>
            <DetailMetadataItem label="Contact person">{client.contact_name ?? "—"}</DetailMetadataItem>
            <DetailMetadataItem label="Contact email">{client.contact_email ?? "—"}</DetailMetadataItem>
            <DetailMetadataItem label="Owner">{ownerName}</DetailMetadataItem>
            <DetailMetadataItem label="Health score">
              <ClientHealthScoreWithTooltip score={client.health_score} />
            </DetailMetadataItem>
          </dl>
        </DetailSection>

        <DetailSection
          id="client-health"
          title="Health"
          description="Operational health score, trend, and contributing signals."
        >
          <ClientHealthCard snapshot={healthDetail.latest} />
        </DetailSection>

        <DetailSection
          title="Health history"
          description="Latest health snapshots for this client."
        >
          <ClientHealthHistory snapshots={healthDetail.history} />
        </DetailSection>

        <ClientSuccessSection clientId={client.id} />

        <PredictiveIntelligenceSection clientId={client.id} />

        <ClientKnowledgeSection clientId={client.id} clientName={client.name} sectionId="client-knowledge" />

        <DetailSection
          id="client-reports"
          title="Recent reports"
          description="Generate, publish, and review report versions for this client."
          action={
            canCreateReports ? (
              <DetailViewAllLink href={`/reports/new?clientId=${client.id}`}>
                New report
              </DetailViewAllLink>
            ) : undefined
          }
        >
          {recentReports.length === 0 ? (
            <DetailEmpty message="No reports for this client yet." />
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {recentReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              {primaryReport ? (
                <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4">
                  {canGenerateReports && primaryReport.status === "draft" ? (
                    <GenerateReportButton reportId={primaryReport.id} />
                  ) : null}
                  {canPublishReports && primaryReport.status === "generated" ? (
                    <ReportPublishDialog
                      reportId={primaryReport.id}
                      reportTitle={primaryReport.title}
                    />
                  ) : null}
                  <Link href={`/reports/${primaryReport.id}`} className={linkText}>
                    Open latest report
                  </Link>
                </div>
              ) : null}
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">Version history</p>
                <ReportVersionHistory versions={reportVersions} />
              </div>
            </div>
          )}
        </DetailSection>

        <DetailSection
          id="client-risks"
          title="Client risks"
          description="Open risks detected or tracked for this client."
          action={
            <DetailViewAllLink href={`/risks?tab=open`}>View all risks</DetailViewAllLink>
          }
        >
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-surface/40 p-3">
              <p className="text-xs text-muted">Open risks</p>
              <p className="mt-1 text-lg font-semibold">{riskScoreSummary.openCount}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface/40 p-3">
              <p className="text-xs text-muted">Average score</p>
              <p className="mt-1 text-lg font-semibold">{riskScoreSummary.averageRiskScore ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface/40 p-3">
              <p className="text-xs text-muted">Highest score</p>
              <p className="mt-1 text-lg font-semibold">{riskScoreSummary.highestScore ?? "—"}</p>
            </div>
          </div>
          {clientRisks.length === 0 ? (
            <RiskEmptyState
              title="No open client risks"
              description="Risks will appear when detected automatically or added manually."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {clientRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          )}
          {canCreateClientRisk ? (
            <div className="mt-4">
              <Link href={`/risks/new?clientId=${client.id}`} className={linkText}>
                Create risk for this client
              </Link>
            </div>
          ) : null}
        </DetailSection>

        <DetailSection
          id="client-incidents"
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

        <ClientSlaSummaryCard summary={clientSlaSummary} />

        <ClientMonitoringSummaryCard summary={clientMonitoringSummary} />

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
              <p className="mb-4 text-sm text-muted">
                Portal login URL:{" "}
                <span className="font-medium text-primary">/client-portal/login</span>
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
              id="client-settings"
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
