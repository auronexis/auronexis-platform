import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RiskActionButtons } from "@/components/risks/risk-action-buttons";
import { RiskForm } from "@/components/risks/risk-form";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import { RiskStatusBadge } from "@/components/risks/risk-status-badge";
import {
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
import {
  formatRiskDate,
  formatRiskDateTime,
  RISK_SOURCE_LABELS,
  RISK_STATUSES,
} from "@/lib/risks/types";
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
  const clients = editable ? await listClients(session) : [];
  const orgUsers =
    editable && (session.role === "owner" || session.role === "admin")
      ? await listOrgUsers(session)
      : [];

  const metadataRail = (
    <DetailMetadataRail title="Risk overview">
      <DetailMetadataItem label="Severity">
        <RiskSeverityBadge severity={risk.severity} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Status">
        <RiskStatusBadge status={risk.status} />
      </DetailMetadataItem>
      <DetailMetadataItem label="Source">{RISK_SOURCE_LABELS[risk.source]}</DetailMetadataItem>
      <DetailMetadataItem label="Client">
        <Link href={`/clients/${risk.client_id}`} className={linkText}>
          {risk.clients?.name ?? "View client"}
        </Link>
      </DetailMetadataItem>
      <DetailMetadataItem label="Owner">{risk.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Due">{formatRiskDate(risk.due_at)}</DetailMetadataItem>
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
            <RiskSeverityBadge severity={risk.severity} />
            <RiskStatusBadge status={risk.status} />
          </>
        }
      />
      <DetailPageLayout rail={metadataRail}>
        <DetailSection title="Actions" description="Update risk lifecycle status.">
          <RiskActionButtons riskId={risk.id} status={risk.status} canManage={canManage} />
        </DetailSection>

        {(risk.impact || risk.recommendation || risk.description) && !editable ? (
          <DetailSection title="Details">
            {risk.description ? (
              <p className="whitespace-pre-wrap text-sm text-foreground">{risk.description}</p>
            ) : null}
            {risk.impact ? (
              <div className="mt-4">
                <DetailMetaText>Impact</DetailMetaText>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{risk.impact}</p>
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
