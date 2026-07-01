import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiskActionButtons } from "@/components/risks/risk-action-buttons";
import { RiskActivityFeed } from "@/components/risks/risk-activity-feed";
import { RiskForm } from "@/components/risks/risk-form";
import { RiskOwnerSelect } from "@/components/risks/risk-owner-select";
import { RiskScoreBadge } from "@/components/risks/risk-score-badge";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import { RiskTimeline } from "@/components/risks/risk-timeline";
import {
  DetailMetaText,
  DetailMetadataItem,
  DetailMetadataRail,
  DetailPageHeader,
  DetailPageLayout,
  DetailSection,
} from "@/components/layout/detail-page";
import { listClients } from "@/lib/clients/queries";
import { acceptRiskAction, updateRiskAction } from "@/lib/risks/actions";
import { canEditRisk, canManageRiskLifecycle } from "@/lib/risks/guards";
import { getRiskActivity, getRiskById, listOrgUsers } from "@/lib/risks/queries";
import {
  formatRiskDate,
  formatRiskDateTime,
  RISK_SOURCE_LABELS,
  RISK_STATUSES,
} from "@/lib/risks/types";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { linkText } from "@/lib/ui/tokens";
import { AcceptRiskButton } from "@/components/risks/accept-risk-button";

type RiskDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: RiskDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const risk = await getRiskById(session, id);
  return { title: risk?.title ?? "Risk" };
}

export default async function RiskDetailPage({ params }: RiskDetailPageProps) {
  await requireModuleAccess("risks");
  const session = await requireSession();
  const { id } = await params;
  const risk = await getRiskById(session, id);

  if (!risk) {
    notFound();
  }

  const editable = canEditRisk(session, risk);
  const canManage = canManageRiskLifecycle(session);
  const boundUpdateAction = updateRiskAction.bind(null, risk.id);
  const [clients, orgUsers, activity] = await Promise.all([
    editable ? listClients(session) : Promise.resolve([]),
    editable && (session.role === "owner" || session.role === "admin")
      ? listOrgUsers(session)
      : Promise.resolve([]),
    getRiskActivity(session, risk.id),
  ]);

  const metadataRail = (
    <DetailMetadataRail title="Risk overview">
      <DetailMetadataItem label="Risk score">
        <RiskScoreBadge
          score={risk.risk_score}
          likelihood={risk.likelihood}
          impact={risk.impact_score}
          showBreakdown
        />
      </DetailMetadataItem>
      <DetailMetadataItem label="Likelihood">{risk.likelihood ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Impact score">{risk.impact_score ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Severity">
        <RiskSeverityBadge severity={risk.severity} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Status">
        <RiskStatusBadge status={risk.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Source">{RISK_SOURCE_LABELS[risk.source]}</DetailMetadataItem>
      <DetailMetadataItem label="Category">{risk.category ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Client">
        <Link href={`/clients/${risk.client_id}`} className={linkText}>
          {risk.clients?.name ?? "View client"}
        </Link>
      </DetailMetadataItem>
      <DetailMetadataItem label="Owner">{risk.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Due">{formatRiskDate(risk.due_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Accepted">
        {risk.accepted_at ? formatRiskDateTime(risk.accepted_at) : "—"}
      </DetailMetadataItem>
      <DetailMetadataItem label="Detected">{formatRiskDateTime(risk.detected_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatRiskDateTime(risk.updated_at)}</DetailMetadataItem>
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="risks"
        title={risk.title}
        backHref="/risks"
        backLabel="Back to risks"
        meta={
          <>
            <RiskScoreBadge score={risk.risk_score} />
            <RiskSeverityBadge severity={risk.severity} />
            <RiskStatusBadge status={risk.status} />
          </>
        }
      />
      <DetailPageLayout rail={metadataRail}>
        <DetailSection title="Risk scoring" description="Likelihood × impact composite score.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-surface/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Score</p>
              <div className="mt-2">
                <RiskScoreBadge
                  score={risk.risk_score}
                  likelihood={risk.likelihood}
                  impact={risk.impact_score}
                  showBreakdown
                />
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Likelihood</p>
              <p className="mt-2 text-2xl font-semibold">{risk.likelihood ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Impact</p>
              <p className="mt-2 text-2xl font-semibold">{risk.impact_score ?? "—"}</p>
            </div>
          </div>
        </DetailSection>

        {canManage && session.role !== "staff" ? (
          <DetailSection title="Ownership" description="Assign accountability for this risk.">
            <RiskOwnerSelect
              riskId={risk.id}
              currentOwnerId={risk.owner_user_id}
              orgUsers={orgUsers}
            />
          </DetailSection>
        ) : null}

        {(risk.mitigation_plan || risk.recommendation) && !editable ? (
          <DetailSection title="Mitigation">
            {risk.mitigation_plan ? (
              <div>
                <DetailMetaText>Mitigation plan</DetailMetaText>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{risk.mitigation_plan}</p>
              </div>
            ) : null}
            {risk.recommendation ? (
              <div className="mt-4">
                <DetailMetaText>Recommendation</DetailMetaText>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{risk.recommendation}</p>
              </div>
            ) : null}
          </DetailSection>
        ) : null}

        <DetailSection title="Actions" description="Update risk lifecycle status.">
          <div className="flex flex-wrap items-center gap-3">
            <RiskActionButtons riskId={risk.id} status={risk.status} canManage={canManage} />
            {canManage && !risk.accepted_at ? (
              <AcceptRiskButton riskId={risk.id} action={acceptRiskAction} />
            ) : null}
          </div>
        </DetailSection>

        <DetailSection title="Risk timeline" description="Chronological audit trail for this risk.">
          <RiskTimeline events={activity} />
        </DetailSection>

        <DetailSection title="Activity feed" description="Recent events for this risk.">
          <RiskActivityFeed events={activity} />
        </DetailSection>

        {(risk.impact || risk.recommendation || risk.description) && !editable ? (
          <DetailSection title="Details">
            {risk.description ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{risk.description}</p>
            ) : null}
            {risk.impact ? (
              <div className="mt-4">
                <DetailMetaText>Business impact</DetailMetaText>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{risk.impact}</p>
              </div>
            ) : null}
          </DetailSection>
        ) : null}

        {editable ? (
          <DetailSection title="Edit risk">
            <RiskForm
              action={boundUpdateAction}
              risk={risk}
              clients={clients}
              orgUsers={orgUsers}
              showOwnerSelect={session.role === "owner" || session.role === "admin"}
              allowedStatuses={RISK_STATUSES}
              submitLabel="Save changes"
              pendingLabel="Saving…"
            />
          </DetailSection>
        ) : null}
      </DetailPageLayout>
    </>
  );
}
