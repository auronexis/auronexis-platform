import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GenerateReportDraftButton } from "@/components/report-schedules/generate-report-draft-button";
import { ReportScheduleForm } from "@/components/report-schedules/report-schedule-form";
import { ToggleScheduleActiveButton } from "@/components/report-schedules/toggle-schedule-active-button";
import {
  DetailMetaSeparator,
  DetailMetaText,
  DetailMetadataItem,
  DetailMetadataRail,
  DetailPageHeader,
  DetailPageLayout,
  DetailSection,
} from "@/components/layout/detail-page";
import { listClients } from "@/lib/clients/queries";
import { updateReportScheduleAction } from "@/lib/report-schedules/actions";
import { canManageReportSchedules } from "@/lib/report-schedules/guards";
import { getReportScheduleById } from "@/lib/report-schedules/queries";
import {
  formatScheduleDate,
  formatScheduleDateTime,
  SCHEDULE_FREQUENCY_LABELS,
} from "@/lib/report-schedules/types";
import { listReportTemplateOptions } from "@/lib/report-templates/queries";
import { listOrgUsers } from "@/lib/risks/queries";
import { requireSession } from "@/lib/auth/session";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

type ReportScheduleDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ReportScheduleDetailPageProps): Promise<Metadata> {
  const session = await requireSession();
  const { id } = await params;
  const schedule = await getReportScheduleById(session, id);

  return {
    title: schedule?.title_template ?? "Report schedule",
  };
}

export default async function ReportScheduleDetailPage({ params }: ReportScheduleDetailPageProps) {
  await requireModuleAccess("reports");
  const session = await requireSession();
  const { id } = await params;
  const schedule = await getReportScheduleById(session, id);

  if (!schedule) {
    notFound();
  }

  const canManage = canManageReportSchedules(session);

  const metadataRail = (
    <DetailMetadataRail title="Schedule overview">
      <DetailMetadataItem label="Status">
        <span
          className={
            schedule.is_active
              ? "inline-flex rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
              : "inline-flex rounded-full border border-border bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted"
          }
        >
          {schedule.is_active ? "Active" : "Inactive"}
        </span>
      </DetailMetadataItem>
      <DetailMetadataItem label="Client">{schedule.clients?.name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Frequency">
        {SCHEDULE_FREQUENCY_LABELS[schedule.frequency]}
      </DetailMetadataItem>
      <DetailMetadataItem label="Template">{schedule.report_templates?.name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Assignee">{schedule.users?.full_name ?? "—"}</DetailMetadataItem>
      <DetailMetadataItem label="Next run">{formatScheduleDate(schedule.next_run_at)}</DetailMetadataItem>
      <DetailMetadataItem label="Last run">
        {formatScheduleDateTime(schedule.last_run_at)}
      </DetailMetadataItem>
    </DetailMetadataRail>
  );

  if (!canManage) {
    return (
      <>
        <DetailPageHeader
          module="reports"
          eyebrow="Report schedules"
          title={schedule.title_template}
          description="Recurring report schedule details."
          backHref="/reports/schedules"
          backLabel="Back to schedules"
          meta={
            <>
              <DetailMetaText>
                {schedule.is_active ? "Active" : "Inactive"}
              </DetailMetaText>
              <DetailMetaSeparator />
              <DetailMetaText>Next run {formatScheduleDate(schedule.next_run_at)}</DetailMetaText>
            </>
          }
        />

        <DetailPageLayout rail={metadataRail}>
          <DetailSection title="Schedule details">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailMetadataItem label="Client">{schedule.clients?.name ?? "—"}</DetailMetadataItem>
              <DetailMetadataItem label="Frequency">
                {SCHEDULE_FREQUENCY_LABELS[schedule.frequency]}
              </DetailMetadataItem>
              <DetailMetadataItem label="Template">
                {schedule.report_templates?.name ?? "—"}
              </DetailMetadataItem>
              <DetailMetadataItem label="Assigned to">
                {schedule.users?.full_name ?? "—"}
              </DetailMetadataItem>
            </dl>
          </DetailSection>
        </DetailPageLayout>
      </>
    );
  }

  const [clients, orgUsers, templates] = await Promise.all([
    listClients(session),
    listOrgUsers(session),
    listReportTemplateOptions(session),
  ]);
  const boundUpdateAction = updateReportScheduleAction.bind(null, schedule.id);

  return (
    <>
      <DetailPageHeader
        module="reports"
        eyebrow="Report schedules"
        title={schedule.title_template}
        description="Manage recurring report generation for this client."
        backHref="/reports/schedules"
        backLabel="Back to schedules"
        meta={
          <>
            <span
              className={
                schedule.is_active
                  ? "inline-flex rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success"
                  : "inline-flex rounded-full border border-border bg-muted/10 px-2.5 py-0.5 text-xs font-semibold text-muted"
              }
            >
              {schedule.is_active ? "Active" : "Inactive"}
            </span>
            <DetailMetaSeparator />
            <DetailMetaText>Next run {formatScheduleDate(schedule.next_run_at)}</DetailMetaText>
            {schedule.last_run_at ? (
              <>
                <DetailMetaSeparator />
                <DetailMetaText>
                  Last run {formatScheduleDateTime(schedule.last_run_at)}
                </DetailMetaText>
              </>
            ) : null}
          </>
        }
      />

      <DetailPageLayout rail={metadataRail}>
        <div className="grid gap-6 sm:grid-cols-2">
          <DetailSection
            title="Generate draft"
            description={`Create a draft report using the previous ${
              schedule.frequency === "monthly" ? "calendar month" : "calendar quarter"
            }.`}
          >
            <GenerateReportDraftButton scheduleId={schedule.id} />
          </DetailSection>

          <DetailSection
            title="Schedule status"
            description="Deactivated schedules remain in the system but are not intended for automatic runs."
          >
            <ToggleScheduleActiveButton scheduleId={schedule.id} isActive={schedule.is_active} />
          </DetailSection>
        </div>

        <DetailSection title="Edit schedule" description="Update recurrence, client, and template settings.">
          <ReportScheduleForm
            action={boundUpdateAction}
            schedule={schedule}
            clients={clients}
            orgUsers={orgUsers}
            templates={templates}
            submitLabel="Save changes"
            pendingLabel="Saving…"
          />
        </DetailSection>
      </DetailPageLayout>
    </>
  );
}
