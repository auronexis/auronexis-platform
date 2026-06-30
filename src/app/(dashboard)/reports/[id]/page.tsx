import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GenerateReportButton } from "@/components/reports/generate-report-button";
import { ReportHealthChart } from "@/components/reports/report-health-chart";
import { ReportPublishDialog } from "@/components/reports/report-publish-dialog";
import { ReportSlaCard } from "@/components/reports/report-sla-card";
import { ReportSummaryCard } from "@/components/reports/report-summary-card";
import { ReportVersionHistory } from "@/components/reports/report-version-history";
import { ArchiveReportButton } from "@/components/reports/archive-report-button";
import { ExportReportPdfButton } from "@/components/reports/export-report-pdf-button";
import { ReportEmailHistory } from "@/components/reports/report-email-history";
import { SendReportEmailButton } from "@/components/reports/send-report-email-button";
import { MarkReportSentButton } from "@/components/reports/mark-report-sent-button";
import { ReportClientInsights } from "@/components/reports/report-client-insights";
import { ReportForm } from "@/components/reports/report-form";
import { ReportEditableWithAI } from "@/components/reports/ai/report-editable-with-ai";
import { RelatedKnowledgeSection } from "@/components/knowledge/related-knowledge-section";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import {
  DetailActionSection,
  DetailEmpty,
  DetailMetaSeparator,
  DetailMetaText,
  DetailMetadataItem,
  DetailMetadataRail,
  DetailPageHeader,
  DetailPageLayout,
  DetailSection,
} from "@/components/layout/detail-page";
import { listClients } from "@/lib/clients/queries";
import { updateReportAction } from "@/lib/reports/actions";
import {
  canEditReport,
  canExportReport,
  canManageReportLifecycle,
  canPublishReport,
  canSendReportEmail,
  canSendReportEmailForStatus,
  canViewReportEmailHistory,
} from "@/lib/reports/guards";
import { listReportEmailDeliveries } from "@/lib/reports/email-queries";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
  getReportById,
} from "@/lib/reports/queries";
import {
  EDITABLE_REPORT_STATUSES,
  formatReportDate,
  formatReportPeriod,
  STAFF_REPORT_STATUSES,
} from "@/lib/reports/types";
import { formatDeliveryDateTime } from "@/lib/reports/email-types";
import { listOrgUsers } from "@/lib/risks/queries";
import { buildReportAIContextFromForm } from "@/lib/ai/prompts";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { requireSession } from "@/lib/auth/session";
import { getReportHistory } from "@/lib/reports-v2/history";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { linkText } from "@/lib/ui/tokens";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ReportDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const report = await getReportById(session, id);

  return {
    title: report?.title ?? "Report",
  };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  await requireModuleAccess("reports");
  const session = await requireSession();
  const { id } = await params;
  const report = await getReportById(session, id);

  if (!report) {
    notFound();
  }

  const canManageLifecycle = canManageReportLifecycle(session);
  const editable =
    canEditReport(session, report) && EDITABLE_REPORT_STATUSES.includes(report.status);
  const canExport = canExportReport(session, report);
  const canEmail =
    canSendReportEmail(session) && canSendReportEmailForStatus(report.status);
  const canViewEmailHistory = canViewReportEmailHistory(session);
  const canMarkReady = canManageLifecycle && report.status === "draft";
  const canPublish = canPublishReport(session) && report.status === "generated";
  const canMarkSent = canManageLifecycle && report.status === "published";
  const canArchive = canManageLifecycle && report.status !== "archived";
  const boundUpdateAction = updateReportAction.bind(null, report.id);
  const clients = editable ? await listClients(session) : [];
  const orgUsers =
    editable && (session.role === "owner" || session.role === "admin")
      ? await listOrgUsers(session)
      : [];
  const allowedStatuses =
    session.role === "staff" ? STAFF_REPORT_STATUSES : EDITABLE_REPORT_STATUSES;

  const [metrics, relatedRisks, relatedIncidents, emailDeliveries, aiAccess, planKey] =
    await Promise.all([
      getClientReportMetrics(session, report.client_id).catch(() => ({
        openRisksCount: 0,
        criticalRisksCount: 0,
        openIncidentsCount: 0,
        criticalIncidentsCount: 0,
      })),
      getRelatedOpenRisks(session, report.client_id).catch(() => []),
      getRelatedOpenIncidents(session, report.client_id).catch(() => []),
      canViewEmailHistory ? listReportEmailDeliveries(session, report.id) : Promise.resolve([]),
      checkPlanFeatureForSession(session, "ai_report_assistant"),
      getCurrentPlan(session.organization.id),
    ]);

  const aiUsageSummary = await getAIUsageSummaryForSession(session, planKey);
  const versionHistory = (await getReportHistory(session, report.id)).data ?? [];

  const aiEnabled = aiAccess.allowed;
  const aiUpgradeMessage = getFeatureUpgradeMessage("ai_report_assistant");
  const aiRequiredPlanLabel = getRequiredPlanLabel("ai_report_assistant");
  const aiContext = buildReportAIContextFromForm({
    reportId: report.id,
    reportTitle: report.title,
    clientId: report.client_id,
    clientName: report.clients?.name ?? "Client",
    organizationName: session.organization.name,
    reportingPeriodStart: report.reporting_period_start,
    reportingPeriodEnd: report.reporting_period_end,
    periodLabel: formatReportPeriod(report.reporting_period_start, report.reporting_period_end),
    executiveSummary: report.executive_summary,
    keyWins: report.key_wins,
    keyRisks: report.key_risks,
    nextActions: report.next_actions,
    openRisks: relatedRisks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      severity: risk.severity,
      status: risk.status,
    })),
    openIncidents: relatedIncidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    })),
    metrics,
  });

  const metadataRail = (
    <DetailMetadataRail
      title="Report overview"
      footer={
        <div className="flex flex-col gap-2">
          {canExport ? <ExportReportPdfButton reportId={report.id} /> : null}
          {canEmail ? (
            <SendReportEmailButton
              reportId={report.id}
              defaultRecipientEmail={report.clients?.contact_email}
            />
          ) : null}
        </div>
      }
    >
      <DetailMetadataItem label="Status">
        <ReportStatusBadge status={report.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Client">
        {report.clients?.name ? (
          <Link href={`/clients/${report.client_id}`} className={linkText}>
            {report.clients.name}
          </Link>
        ) : (
          "—"
        )}
      </DetailMetadataItem>
      <DetailMetadataItem label="Period">
        {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
      </DetailMetadataItem>
      <DetailMetadataItem label="Assignee">{report.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Created">{formatReportDate(report.created_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatReportDate(report.updated_at)}</DetailMetadataItem>
      {report.sent_at ? (
        <DetailMetadataItem label="Last emailed">
          {formatDeliveryDateTime(report.sent_at)}
        </DetailMetadataItem>
      ) : null}
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="reports"
        title={report.title}
        description="Professional report workspace — content, delivery, and client context."
        backHref="/reports"
        backLabel="Back to reports"
        meta={
          <>
            <ReportStatusBadge status={report.status} />
            <DetailMetaSeparator />
            <DetailMetaText>
              {formatReportPeriod(report.reporting_period_start, report.reporting_period_end)}
            </DetailMetaText>
            <DetailMetaSeparator />
            <DetailMetaText>Updated {formatReportDate(report.updated_at)}</DetailMetaText>
            {report.sent_at ? (
              <>
                <DetailMetaSeparator />
                <DetailMetaText className="text-success">
                  Last emailed {formatDeliveryDateTime(report.sent_at)}
                </DetailMetaText>
              </>
            ) : null}
          </>
        }
      />

      <DetailPageLayout rail={metadataRail}>
        {editable ? (
          <ReportEditableWithAI
            aiEnabled={aiEnabled}
            upgradeMessage={aiUpgradeMessage}
            requiredPlanLabel={aiRequiredPlanLabel}
            context={aiContext}
            usageSummary={aiUsageSummary}
          >
            <DetailSection
              title="Edit report"
              description="Update report content and operational metadata."
            >
              <ReportForm
                action={boundUpdateAction}
                report={report}
                clients={clients}
                orgUsers={orgUsers}
                showAssigneeSelect={session.role === "owner" || session.role === "admin"}
                allowedStatuses={allowedStatuses}
                defaultAssignedUserId={session.user.id}
                submitLabel="Save changes"
                pendingLabel="Saving…"
                aiEnabled={aiEnabled}
              />
            </DetailSection>
          </ReportEditableWithAI>
        ) : (
          <>
            <DetailSection title="Executive summary">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {report.executive_summary ?? "—"}
              </p>
            </DetailSection>
            <DetailSection title="Key wins">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {report.key_wins ?? "—"}
              </p>
            </DetailSection>
            <DetailSection title="Key risks">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {report.key_risks ?? "—"}
              </p>
            </DetailSection>
            <DetailSection title="Next actions">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {report.next_actions ?? "—"}
              </p>
            </DetailSection>
          </>
        )}

        {canMarkReady ? (
          <DetailActionSection
            title="Generate report"
            description="Build executive summary, health score, and SLA metrics for this period."
          >
            <GenerateReportButton reportId={report.id} />
          </DetailActionSection>
        ) : null}

        {canPublish ? (
          <DetailActionSection
            title="Publish to client portal"
            description="Make this report visible to the client in their portal."
          >
            <ReportPublishDialog reportId={report.id} reportTitle={report.title} />
          </DetailActionSection>
        ) : null}

        {canMarkSent ? (
          <DetailActionSection
            title="Mark sent"
            description="Record when this report has been delivered to the client outside the portal."
          >
            <MarkReportSentButton reportId={report.id} reportTitle={report.title} />
          </DetailActionSection>
        ) : null}

        {canArchive ? (
          <DetailActionSection
            title="Archive report"
            description="Archived reports are removed from the active list but remain in the system."
            variant="danger"
          >
            <ArchiveReportButton reportId={report.id} reportTitle={report.title} />
          </DetailActionSection>
        ) : null}

        {canViewEmailHistory ? (
          <DetailSection title="Email delivery history" description="Outbound report emails for this record.">
            {emailDeliveries.length === 0 ? (
              <DetailEmpty message="No emails have been sent for this report yet." />
            ) : (
              <ReportEmailHistory deliveries={emailDeliveries} />
            )}
          </DetailSection>
        ) : null}

        <DetailSection
          title="Client insights"
          description="Operational context and related open items for this client."
        >
          <DetailSection title="Report summary" description="Auto-generated executive summary and KPIs.">
          <ReportSummaryCard
            summary={report.summary}
            executiveSummary={report.executive_summary}
          />
        </DetailSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <ReportHealthChart trend={null} healthScore={report.health_score} />
          <ReportSlaCard slaScore={report.sla_score} />
        </div>

        <DetailSection title="Version history" description="Previous versions in this report series.">
          <ReportVersionHistory versions={versionHistory} />
        </DetailSection>

        <ReportClientInsights
            metrics={metrics}
            relatedRisks={relatedRisks}
            relatedIncidents={relatedIncidents}
          />
        </DetailSection>

        <RelatedKnowledgeSection
          clientId={report.client_id}
          title={report.title}
          text={[
            report.executive_summary,
            report.key_risks,
            report.key_wins,
            report.next_actions,
          ]
            .filter(Boolean)
            .join(" ")}
          entityType="report"
          entityId={report.id}
        />
      </DetailPageLayout>
    </>
  );
}
