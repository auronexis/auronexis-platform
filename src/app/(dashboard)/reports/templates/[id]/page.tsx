import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteReportTemplateButton } from "@/components/report-templates/delete-report-template-button";
import { ReportTemplateForm } from "@/components/report-templates/report-template-form";
import { SetDefaultTemplateButton } from "@/components/report-templates/set-default-template-button";
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
import { updateReportTemplateAction } from "@/lib/report-templates/actions";
import { canManageReportTemplates } from "@/lib/report-templates/guards";
import { getReportTemplateById } from "@/lib/report-templates/queries";
import { formatTemplateDate } from "@/lib/report-templates/types";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type ReportTemplateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ReportTemplateDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const template = await getReportTemplateById(session, id);

  return {
    title: template?.name ?? "Report template",
  };
}

export default async function ReportTemplateDetailPage({ params }: ReportTemplateDetailPageProps) {
  await requireModuleAccess("reports");
  const session = await requireSession();
  const { id } = await params;
  const template = await getReportTemplateById(session, id);

  if (!template) {
    notFound();
  }

  const canManage = canManageReportTemplates(session);
  const boundUpdateAction = updateReportTemplateAction.bind(null, template.id);

  const metadataRail = (
    <DetailMetadataRail title="Template overview">
      <DetailMetadataItem label="Default">
        {template.is_default ? (
          <span className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
            Default template
          </span>
        ) : (
          "No"
        )}
      </DetailMetadataItem>
      <DetailMetadataItem label="Created by">{template.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Created">{formatTemplateDate(template.created_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Updated">{formatTemplateDate(template.updated_at)}</DetailMetadataItem>
    </DetailMetadataRail>
  );

  return (
    <>
      <DetailPageHeader
        module="reports"
        eyebrow="Report templates"
        title={template.name}
        description={
          canManage
            ? "Reusable report content for your organization."
            : "View reusable report content for your organization."
        }
        backHref="/reports/templates"
        backLabel="Back to templates"
        meta={
          <>
            {template.is_default ? (
              <span className="inline-flex rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                Default
              </span>
            ) : null}
            <DetailMetaSeparator />
            <DetailMetaText>Updated {formatTemplateDate(template.updated_at)}</DetailMetaText>
            <DetailMetaSeparator />
            <DetailMetaText>Created by {template.users?.full_name ?? "—"}</DetailMetaText>
          </>
        }
      />

      <DetailPageLayout rail={metadataRail}>
        {canManage ? (
          <>
            <DetailSection
              title="Edit template"
              description="Update reusable content blocks for new reports."
            >
              <ReportTemplateForm
                action={boundUpdateAction}
                template={template}
                submitLabel="Save changes"
                pendingLabel="Saving…"
              />
            </DetailSection>

            <DetailActionSection
              title="Default template"
              description="Only one template can be the organization default. It appears as a quick option when creating reports."
            >
              <SetDefaultTemplateButton
                templateId={template.id}
                templateName={template.name}
                isDefault={template.is_default}
              />
            </DetailActionSection>

            <DetailActionSection
              title="Delete template"
              description="Deleting a template does not affect existing reports. Linked schedules will continue without template content."
              variant="danger"
            >
              <DeleteReportTemplateButton templateId={template.id} templateName={template.name} />
            </DetailActionSection>
          </>
        ) : (
          <>
            {template.description ? (
              <DetailSection title="Description">
                <p className="text-sm leading-relaxed text-muted">{template.description}</p>
              </DetailSection>
            ) : null}
            <DetailSection title="Template content">
              <dl className="grid gap-6">
                <DetailMetadataItem label="Executive summary template">
                  <span className="whitespace-pre-wrap">{template.executive_summary_template ?? "—"}</span>
                </DetailMetadataItem>
                <DetailMetadataItem label="Key wins template">
                  <span className="whitespace-pre-wrap">{template.key_wins_template ?? "—"}</span>
                </DetailMetadataItem>
                <DetailMetadataItem label="Key risks template">
                  <span className="whitespace-pre-wrap">{template.key_risks_template ?? "—"}</span>
                </DetailMetadataItem>
                <DetailMetadataItem label="Next actions template">
                  <span className="whitespace-pre-wrap">{template.next_actions_template ?? "—"}</span>
                </DetailMetadataItem>
              </dl>
            </DetailSection>
          </>
        )}
      </DetailPageLayout>
    </>
  );
}
