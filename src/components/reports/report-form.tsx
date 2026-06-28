"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { ReportAIFieldLabel } from "@/components/reports/ai/report-ai-section-button";
import { useOptionalReportAI } from "@/components/reports/ai/report-ai-provider";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { FormFooter, FormRoot, FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ReportAISectionKey } from "@/lib/ai/types";
import type { ReportActionState } from "@/lib/reports/actions";
import {
  applyReportTemplate,
  emptyReportTemplateContent,
  type ReportTemplateContent,
  type ReportTemplateListItem,
} from "@/lib/report-templates/types";
import {
  REPORT_STATUS_LABELS,
  toDateInputValue,
  type ReportWithRelations,
} from "@/lib/reports/types";
import { formGrid, formFieldShell } from "@/lib/ui/form-tokens";
import { auroraInputFocus } from "@/lib/ui/motion";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import { useFormActionFeedback } from "@/lib/ui/use-form-action-feedback";
import type { AppUser, Client, ReportStatus } from "@/types/database";

export type ReportTemplateOption = Pick<
  ReportTemplateListItem,
  | "id"
  | "name"
  | "is_default"
  | "executive_summary_template"
  | "key_wins_template"
  | "key_risks_template"
  | "next_actions_template"
>;

type ReportFormProps = {
  action: (
    prevState: ReportActionState,
    formData: FormData,
  ) => Promise<ReportActionState>;
  report?: ReportWithRelations;
  clients: Pick<Client, "id" | "name">[];
  orgUsers?: Pick<AppUser, "id" | "full_name">[];
  showAssigneeSelect: boolean;
  allowedStatuses: ReportStatus[];
  defaultAssignedUserId?: string;
  submitLabel: string;
  pendingLabel: string;
  templates?: ReportTemplateOption[];
  aiEnabled?: boolean;
};

const initialState: ReportActionState = {};

function resolveTemplateContent(
  selection: string,
  templates: ReportTemplateOption[],
): ReportTemplateContent {
  if (selection === "blank") {
    return emptyReportTemplateContent();
  }

  if (selection === "default") {
    const defaultTemplate = templates.find((template) => template.is_default);
    return defaultTemplate ? applyReportTemplate(defaultTemplate) : emptyReportTemplateContent();
  }

  const template = templates.find((item) => item.id === selection);
  return template ? applyReportTemplate(template) : emptyReportTemplateContent();
}

export function ReportForm({
  action,
  report,
  clients,
  orgUsers = [],
  showAssigneeSelect,
  allowedStatuses,
  defaultAssignedUserId,
  submitLabel,
  pendingLabel,
  templates = [],
  aiEnabled = false,
}: ReportFormProps) {
  const reportAI = useOptionalReportAI();
  const useAIFields = aiEnabled && reportAI !== null;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const defaultTemplateSelection = useMemo(() => {
    if (report || templates.length === 0) {
      return "blank";
    }

    return templates.some((template) => template.is_default) ? "default" : "blank";
  }, [report, templates]);

  const [templateSelection, setTemplateSelection] = useState(defaultTemplateSelection);
  const templateContent = useMemo(
    () => resolveTemplateContent(templateSelection, templates),
    [templateSelection, templates],
  );
  const templateExecutiveSummary = templateContent.executive_summary ?? "";
  const templateKeyWins = templateContent.key_wins ?? "";
  const templateKeyRisks = templateContent.key_risks ?? "";
  const templateNextActions = templateContent.next_actions ?? "";

  const defaultStatus = report?.status ?? allowedStatuses[0] ?? "draft";
  const defaultAssignee =
    report?.assigned_user_id ?? defaultAssignedUserId ?? orgUsers[0]?.id ?? "";

  const contentDefaults = report
    ? {
        executiveSummary: report.executive_summary ?? "",
        keyWins: report.key_wins ?? "",
        keyRisks: report.key_risks ?? "",
        nextActions: report.next_actions ?? "",
      }
    : {
        executiveSummary: templateContent.executive_summary ?? "",
        keyWins: templateContent.key_wins ?? "",
        keyRisks: templateContent.key_risks ?? "",
        nextActions: templateContent.next_actions ?? "",
      };

  const templateOptions = useMemo(() => {
    const options = [{ value: "blank", label: "Blank report" }];
    if (templates.some((template) => template.is_default)) {
      options.push({ value: "default", label: "Default template" });
    }
    for (const template of templates) {
      options.push({
        value: template.id,
        label: `${template.name}${template.is_default ? " (default)" : ""}`,
      });
    }
    return options;
  }, [templates]);

  useFormActionFeedback(state, isPending, { successMessage: "Report updated" });

  const syncWorkspaceMeta = useCallback(
    (patch: {
      clientId?: string;
      reportTitle?: string;
      reportingPeriodStart?: string;
      reportingPeriodEnd?: string;
    }) => {
      if (useAIFields && reportAI) {
        reportAI.updateWorkspaceMeta(patch);
      }
    },
    [reportAI, useAIFields],
  );

  const setAIFieldValues = reportAI?.setFieldValues;

  useEffect(() => {
    if (!useAIFields || report || !setAIFieldValues) {
      return;
    }

    setAIFieldValues({
      executive_summary: templateExecutiveSummary,
      key_wins: templateKeyWins,
      key_risks: templateKeyRisks,
      next_actions: templateNextActions,
    });
  }, [
    report,
    useAIFields,
    setAIFieldValues,
    templateExecutiveSummary,
    templateKeyWins,
    templateKeyRisks,
    templateNextActions,
  ]);

  const contentFields: Array<{
    section: ReportAISectionKey;
    name: string;
    label: string;
    rows?: number;
    placeholder: string;
    value: string;
  }> = [
    {
      section: "executive_summary",
      name: "executiveSummary",
      label: "Executive summary",
      placeholder: "High-level overview of client outcomes this period.",
      value: useAIFields
        ? reportAI.fieldValues.executive_summary
        : contentDefaults.executiveSummary,
    },
    {
      section: "key_wins",
      name: "keyWins",
      label: "Key wins",
      rows: 3,
      placeholder: "Deliverables completed, improvements made, value delivered.",
      value: useAIFields ? reportAI.fieldValues.key_wins : contentDefaults.keyWins,
    },
    {
      section: "key_risks",
      name: "keyRisks",
      label: "Key risks",
      rows: 3,
      placeholder: "Operational risks the client should be aware of.",
      value: useAIFields ? reportAI.fieldValues.key_risks : contentDefaults.keyRisks,
    },
    {
      section: "next_actions",
      name: "nextActions",
      label: "Next actions",
      rows: 3,
      placeholder: "Planned follow-ups and recommended next steps.",
      value: useAIFields ? reportAI.fieldValues.next_actions : contentDefaults.nextActions,
    },
  ];

  return (
    <form action={formAction} key={`${report?.id ?? "new"}-${templateSelection}`}>
      <FormRoot>
        {!report && templates.length > 0 ? (
          <FormSection title="Template" description="Pre-fill content from an organization template.">
            <Select
              id="templateSelection"
              name="templateSelection"
              label="Start from template"
              value={templateSelection}
              onChange={(event) => setTemplateSelection(event.target.value)}
              description="Template content pre-fills the fields below. You can edit everything before saving."
              options={templateOptions}
            />
          </FormSection>
        ) : null}

        <FormSection title="General" description="Report title, client, and workflow status.">
          <div className={formGrid}>
            <div className="sm:col-span-2">
              <Input
                name="title"
                label="Report title"
                required
                defaultValue={report?.title ?? ""}
                placeholder="Q2 Executive Summary"
                onChange={(event) =>
                  syncWorkspaceMeta({ reportTitle: event.target.value })
                }
              />
            </div>
            <Select
              id="clientId"
              name="clientId"
              label="Client"
              required
              defaultValue={report?.client_id ?? ""}
              placeholder="Select a client"
              options={clients.map((client) => ({ value: client.id, label: client.name }))}
              onChange={(event) => syncWorkspaceMeta({ clientId: event.target.value })}
            />
            <Select
              id="status"
              name="status"
              label="Status"
              defaultValue={defaultStatus}
              options={allowedStatuses.map((status) => ({
                value: status,
                label: REPORT_STATUS_LABELS[status],
              }))}
            />
          </div>
        </FormSection>

        <FormSection title="Reporting period" description="The date range this report covers.">
          <div className={formGrid}>
            <Input
              name="reportingPeriodStart"
              type="date"
              label="Reporting period start"
              required
              defaultValue={toDateInputValue(report?.reporting_period_start)}
              onChange={(event) =>
                syncWorkspaceMeta({ reportingPeriodStart: event.target.value })
              }
            />
            <Input
              name="reportingPeriodEnd"
              type="date"
              label="Reporting period end"
              required
              defaultValue={toDateInputValue(report?.reporting_period_end)}
              onChange={(event) =>
                syncWorkspaceMeta({ reportingPeriodEnd: event.target.value })
              }
            />
          </div>
        </FormSection>

        <FormSection title="Ownership" description="Who owns delivery of this report.">
          {showAssigneeSelect ? (
            <Select
              id="assignedUserId"
              name="assignedUserId"
              label="Assigned to"
              required
              defaultValue={defaultAssignee}
              options={orgUsers.map((user) => ({ value: user.id, label: user.full_name }))}
            />
          ) : (
            <input
              type="hidden"
              name="assignedUserId"
              value={defaultAssignedUserId ?? defaultAssignee}
            />
          )}
        </FormSection>

        <FormSection title="Report content" description="Executive narrative and operational highlights.">
          {contentFields.map((field) =>
            useAIFields && reportAI ? (
              <ReportAIContentField
                key={field.section}
                section={field.section}
                name={field.name}
                label={field.label}
                rows={field.rows}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(value) => reportAI.setFieldValue(field.section, value)}
              />
            ) : (
              <Textarea
                key={field.name}
                id={field.name}
                name={field.name}
                label={field.label}
                rows={field.rows}
                defaultValue={field.value}
                placeholder={field.placeholder}
              />
            ),
          )}
        </FormSection>

        {state.error ? <FormAlert variant="error">{state.error}</FormAlert> : null}

        <FormFooter>
          <Button type="submit" disabled={isPending} loading={isPending} loadingText={pendingLabel}>
            {submitLabel}
          </Button>
        </FormFooter>
      </FormRoot>
    </form>
  );
}

type ReportAIContentFieldProps = {
  section: ReportAISectionKey;
  name: string;
  label: string;
  rows?: number;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
};

function ReportAIContentField({
  section,
  name,
  label,
  rows = 4,
  placeholder,
  value,
  onChange,
}: ReportAIContentFieldProps) {
  return (
    <div className={formFieldShell}>
      <ReportAIFieldLabel section={section} htmlFor={name} label={label} />
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex min-h-[5rem] w-full cursor-text resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs",
          transitionInteractive,
          "placeholder:text-muted/80",
          auroraInputFocus,
          focusRing,
        )}
      />
    </div>
  );
}
